import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBookingSchema, insertAmenitySchema, insertPropertyImageSchema, insertReviewSchema, insertMessageSchema, signupSchema, loginSchema, updateUserProfileSchema } from "@shared/schema";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db } from "./db";
import { sql, eq } from "drizzle-orm";
import { loggedOutSessions } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = crypto.randomUUID() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files statically
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  }, (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    console.log('🔴 SERVER: Auth user endpoint hit');
    console.log('🔴 SERVER: Session ID:', req.sessionID);
    console.log('🔴 SERVER: Request user:', req.user);
    console.log('🔴 SERVER: Is authenticated:', req.isAuthenticated());
    
    // Check if this session has been logged out
    try {
      const loggedOutSession = await db.select().from(loggedOutSessions).where(eq(loggedOutSessions.sessionId, req.sessionID));
      if (loggedOutSession.length > 0) {
        console.log('🔴 SERVER: Session found in logged out sessions, returning 401');
        return res.status(401).json({ message: "Session invalidated" });
      }
    } catch (error) {
      console.log('🔴 SERVER: Error checking logged out sessions:', error);
    }
    
    // Check for logout flag in session
    if ((req.session as any)?.loggedOut) {
      console.log('🔴 SERVER: Logout flag detected, returning 401');
      return res.status(401).json({ message: "Logged out" });
    }
    
    if (!req.user || !req.isAuthenticated()) {
      console.log('🔴 SERVER: No user or not authenticated, returning 401');
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      // For local auth users, get fresh data from database
      if ((req.user as any).authProvider === 'local') {
        console.log('🔴 SERVER: Local auth user, fetching from database');
        const user = await storage.getUser((req.user as any).id);
        if (!user) {
          console.log('🔴 SERVER: User not found in database, clearing session');
          req.logout(() => {
            req.session.destroy(() => {
              res.status(401).json({ message: "User not found" });
            });
          });
          return;
        }
        console.log('🔴 SERVER: Returning local user data');
        return res.json(user);
      }

      // For Replit auth users, return user from session
      console.log('🔴 SERVER: Returning Replit auth user data');
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("🔴 SERVER: Error in /api/auth/user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user profile
  app.put('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = updateUserProfileSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserProfile(userId, validatedData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get user referral statistics
  app.get('/api/auth/referral-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserReferralStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: "Failed to fetch referral statistics" });
    }
  });

  // Initialize admin user if it doesn't exist
  async function initializeAdminUser() {
    try {
      const adminEmail = "admin@allarco.com";
      const existingAdmin = await storage.getUserByEmail(adminEmail);
      
      if (!existingAdmin) {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash("admin123", saltRounds);
        
        const adminUser = await storage.createAdminUser({
          firstName: "Hassan",
          lastName: "Cheema",
          email: adminEmail,
          password: hashedPassword,
        });
        
        console.log("Admin user created successfully:", adminUser.email);
      } else {
        console.log("Admin user already exists");
      }
    } catch (error) {
      console.error("Error initializing admin user:", error);
    }
  }

  // Initialize admin user on server start
  initializeAdminUser();

  // Local signup route
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

      // Create user
      const user = await storage.createLocalUser({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        password: hashedPassword,
        referralCode: validatedData.referralCode,
      });

      // Create session automatically after signup (same logic as login)
      const sessionUser = {
        claims: { sub: user.id },
        access_token: 'local_session',
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      };

      req.login(sessionUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Account created but session creation failed" });
        }
        
        // Return user without password, include referral info for confirmation
        const { password, ...userResponse } = user;
        res.status(201).json({ 
          message: "Account created successfully",
          user: userResponse,
          referralCode: user.referralCode,
          wasReferred: !!user.referrerName,
          referrerName: user.referrerName
        });
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Local login route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user || user.authProvider !== 'local' || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session compatible with Replit Auth middleware
      const sessionUser = {
        claims: { sub: user.id },
        access_token: 'local_session',
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      };

      req.login(sessionUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Session creation failed" });
        }
        
        // Return user without password
        const { password, ...userResponse } = user;
        res.json({ 
          message: "Login successful",
          user: userResponse 
        });
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Block dates endpoint for admin
  app.post('/api/admin/block-dates', isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate, reason } = req.body;
      
      if (!startDate || !endDate || !reason) {
        return res.status(400).json({ message: "Start date, end date, and reason are required" });
      }

      // Create blocked booking entries for each date in the range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Create a blocked booking for this date
        await storage.createBooking({
          guestFirstName: 'Blocked',
          guestLastName: 'Period',
          guestEmail: 'admin@system.local',
          guestCountry: 'System',
          guestPhone: '000-000-0000',
          checkInDate: dateStr,
          checkOutDate: dateStr,
          guests: 0,
          paymentMethod: 'property',
          createdBy: 'admin',
          blockReason: reason,
          bookedForSelf: false
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      res.json({ message: "Dates blocked successfully" });
    } catch (error: any) {
      console.error("Block dates error:", error);
      res.status(500).json({ message: "Failed to block dates" });
    }
  });

  // Manual booking endpoint for admin
  app.post('/api/admin/manual-booking', isAuthenticated, async (req, res) => {
    try {
      const {
        guestFirstName,
        guestLastName,
        guestEmail,
        checkInDate,
        checkOutDate,
        guests,
        paymentMethod,
        customPrice
      } = req.body;

      if (!guestFirstName || !guestLastName || !guestEmail || !checkInDate || !checkOutDate) {
        return res.status(400).json({ message: "All guest details and dates are required" });
      }

      // Check availability
      const isAvailable = await storage.checkAvailability(checkInDate, checkOutDate);
      if (!isAvailable) {
        return res.status(400).json({ message: "Selected dates are not available" });
      }

      // Calculate pricing with custom price if provided
      const pricingData = await storage.calculateBookingPricing(
        checkInDate, 
        checkOutDate, 
        guests, 
        false, // no pet for manual bookings
        undefined // no referral code
      );

      // Override base price if custom price provided
      let finalTotalPrice = pricingData.totalPrice;
      if (customPrice && parseFloat(customPrice) > 0) {
        const customBasePrice = parseFloat(customPrice);
        const nightsTotal = customBasePrice * pricingData.totalNights;
        finalTotalPrice = nightsTotal + pricingData.cleaningFee + pricingData.serviceFee + pricingData.cityTax;
      }

      // Create the booking
      const booking = await storage.createBooking({
        guestFirstName,
        guestLastName,
        guestEmail,
        guestCountry: 'Admin Entry',
        guestPhone: '000-000-0000',
        checkInDate,
        checkOutDate,
        guests,
        paymentMethod: paymentMethod || 'property',
        createdBy: 'admin',
        bookedForSelf: false,
        hasPet: false
      });

      res.json({ 
        message: "Manual booking created successfully",
        booking,
        totalPrice: finalTotalPrice
      });
    } catch (error: any) {
      console.error("Manual booking error:", error);
      res.status(500).json({ message: "Failed to create manual booking" });
    }
  });

  // Local logout route - complete session reset with database cleanup
  app.post('/api/auth/logout', async (req, res) => {
    console.log('🔴 SERVER: Local logout endpoint hit');
    console.log('🔴 SERVER: Session ID:', req.sessionID);
    console.log('🔴 SERVER: Current user:', req.user);
    
    const sessionId = req.sessionID;
    
    // Clear the user immediately
    req.user = undefined;
    
    // Logout using passport first
    req.logout((err) => {
      if (err) {
        console.error("🔴 SERVER: Passport logout error:", err);
      }
      console.log('🔴 SERVER: Passport logout completed');
      
      // Destroy the session completely
      req.session.destroy(async (sessionErr) => {
        if (sessionErr) {
          console.error("🔴 SERVER: Session destroy error:", sessionErr);
        }
        console.log('🔴 SERVER: Session destroyed');
        
        // Delete session from database directly as backup
        try {
          if (sessionId) {
            const { db } = await import('./db');
            const { sql } = await import('drizzle-orm');
            await db.execute(sql`DELETE FROM sessions WHERE sid = ${sessionId}`);
            console.log('🔴 SERVER: Session deleted from database');
          }
        } catch (dbError) {
          console.log('🔴 SERVER: Database cleanup failed (non-critical):', dbError);
        }
        
        // Clear all possible cookie variations
        res.clearCookie('connect.sid', { path: '/' });
        res.clearCookie('connect.sid', { path: '/', domain: req.hostname });
        res.clearCookie('connect.sid', { path: '/', httpOnly: true });
        res.clearCookie('connect.sid', { path: '/', httpOnly: true, secure: true });
        console.log('🔴 SERVER: Cookies cleared');
        
        // Set headers to prevent caching
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        
        console.log('🔴 SERVER: Logout completed successfully');
        res.json({ message: "Logout successful", cleared: true, sessionCleared: true });
      });
    });
  });

  // Logout redirect endpoint - complete session termination with logout tracking
  app.get('/api/auth/logout-redirect', async (req, res) => {
    console.log('🔴 SERVER: Logout redirect endpoint hit');
    console.log('🔴 SERVER: Current user before logout:', req.user);
    console.log('🔴 SERVER: Session ID before logout:', req.sessionID);
    console.log('🔴 SERVER: Is authenticated:', req.isAuthenticated());
    
    const sessionId = req.sessionID;
    
    // Record this session as logged out
    try {
      await db.insert(loggedOutSessions).values({
        sessionId: sessionId,
        userId: req.user ? (req.user as any).id : 'unknown',
      });
      console.log('🔴 SERVER: Session recorded in logout tracking table');
    } catch (error) {
      console.log('🔴 SERVER: Error recording logout:', error);
    }
    
    // Set logout flag in session before destroying
    (req.session as any).loggedOut = true;
    console.log('🔴 SERVER: Logout flag set in session');
    
    // Clear the user immediately
    req.user = undefined;
    console.log('🔴 SERVER: User cleared from request');
    
    try {
      // Delete session from database directly
      if (sessionId) {
        await db.execute(sql`DELETE FROM sessions WHERE sid = ${sessionId}`);
        console.log('🔴 SERVER: Session deleted from database');
      }
    } catch (dbError) {
      console.log('🔴 SERVER: Database cleanup error (continuing):', dbError);
    }
    
    // Logout using passport
    req.logout((err) => {
      if (err) {
        console.error("🔴 SERVER: Passport logout error:", err);
      }
      console.log('🔴 SERVER: Passport logout completed');
      
      // Destroy the session completely
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("🔴 SERVER: Session destroy error:", sessionErr);
        }
        console.log('🔴 SERVER: Session destroyed successfully');
        
        // Clear all cookies with all possible variations
        const cookieOptions = [
          { path: '/' },
          { path: '/', domain: req.hostname },
          { path: '/', httpOnly: true },
          { path: '/', httpOnly: true, secure: true },
          { path: '/', httpOnly: true, secure: false },
          { path: '/', sameSite: 'lax' as const },
          { path: '/', sameSite: 'strict' as const },
        ];
        
        cookieOptions.forEach(options => {
          res.clearCookie('connect.sid', options);
        });
        console.log('🔴 SERVER: All cookies cleared');
        
        // Set aggressive no-cache headers
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Last-Modified': new Date(0).toUTCString(),
          'ETag': ''
        });
        console.log('🔴 SERVER: No-cache headers set');
        
        // Redirect to homepage with cache busting
        console.log('🔴 SERVER: Redirecting to homepage with cache busting');
        res.redirect('/?logout=success&t=' + Date.now());
      });
    });
  });

  // Calculate booking pricing endpoint
  app.post('/api/bookings/calculate-pricing', async (req, res) => {
    try {
      const { checkInDate, checkOutDate, guests, hasPet, referralCode } = req.body;
      
      if (!checkInDate || !checkOutDate || !guests) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const pricing = await storage.calculateBookingPricing(
        checkInDate,
        checkOutDate,
        parseInt(guests),
        Boolean(hasPet),
        referralCode || undefined
      );

      res.json(pricing);
    } catch (error) {
      console.error('Error calculating pricing:', error);
      res.status(500).json({ message: "Failed to calculate pricing" });
    }
  });

  // Separate endpoint for blocking dates (administrative blocks)
  app.post("/api/block-dates", isAuthenticated, async (req, res) => {
    try {
      console.log("🟡 SERVER: Block dates request received:", req.body);
      
      const { checkInDate, checkOutDate, blockReason } = req.body;
      
      if (!checkInDate || !checkOutDate || !blockReason) {
        console.log("🔴 SERVER: Missing required block data");
        return res.status(400).json({ message: "Missing required block information" });
      }
      
      // Create administrative block entry
      const blockData = {
        guestFirstName: "BLOCKED",
        guestLastName: blockReason,
        guestEmail: "system@blocked.com",
        guestCountry: "Administrative",
        guestPhone: "000-000-0000",
        checkInDate,
        checkOutDate,
        guests: 0,
        paymentMethod: "property" as const,
        hasPet: false,
        createdBy: "admin" as const,
        bookedForSelf: false,
        bookingSource: "blocked" as const,
        blockReason,
        totalPrice: 0,
      };
      
      console.log("🟡 SERVER: Creating block with data:", blockData);
      const block = await storage.createBooking(blockData);
      console.log("🟢 SERVER: Block created successfully:", block.id);
      
      res.json({ success: true, blockId: block.id });
    } catch (error: any) {
      console.error("🔴 SERVER: Failed to create block:", error);
      res.status(400).json({ message: error.message || "Failed to block dates" });
    }
  });

  // Create comprehensive booking endpoint
  app.post('/api/bookings', async (req, res) => {
    try {
      console.log("🟡 SERVER: Booking creation request received:", req.body);
      
      const {
        guestFirstName,
        guestLastName,
        guestEmail,
        guestCountry,
        guestPhone,
        checkInDate,
        checkOutDate,
        guests,
        paymentMethod = 'online',
        hasPet = false,
        referralCode,
        creditsUsed = 0,
        createdBy = 'guest',
        bookedForSelf = true
      } = req.body;

      // Validate required fields
      if (!guestFirstName || !guestLastName || !guestEmail || !guestCountry || !guestPhone || !checkInDate || !checkOutDate || !guests) {
        console.log("🔴 SERVER: Missing required booking information");
        return res.status(400).json({ message: "Missing required booking information" });
      }

      // Check availability first
      const isAvailable = await storage.checkAvailability(checkInDate, checkOutDate);
      if (!isAvailable) {
        return res.status(400).json({ message: "Selected dates are not available" });
      }

      // Validate booking length (max 15 days)
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      if (totalNights > 15) {
        return res.status(400).json({ message: "Maximum booking length is 15 days" });
      }

      if (totalNights < 1) {
        return res.status(400).json({ message: "Invalid booking dates" });
      }

      // Validate guest count
      if (guests < 1 || guests > 5) {
        return res.status(400).json({ message: "Guest count must be between 1 and 5" });
      }

      const booking = await storage.createBooking({
        guestFirstName,
        guestLastName,
        guestEmail,
        guestCountry,
        guestPhone,
        checkInDate,
        checkOutDate,
        guests: parseInt(guests),
        paymentMethod: paymentMethod as "online" | "property",
        hasPet,
        referralCode,
        creditsUsed: creditsUsed ? parseFloat(creditsUsed) : 0,
        createdBy: createdBy as "admin" | "guest",
        bookedForSelf,
        userId: req.isAuthenticated() ? (req.user as any)?.claims?.sub || null : null
      });

      // Broadcast new booking via WebSocket
      broadcastToAdmins({
        type: 'new_booking',
        data: booking
      });

      res.status(201).json(booking);
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Get booking by confirmation code
  app.get('/api/bookings/confirmation/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const booking = await storage.getBookingByConfirmationCode(code);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Get booking dates for calendar (public endpoint for real-time availability)
  app.get('/api/bookings/dates', async (req, res) => {
    try {
      // Get all confirmed bookings for calendar availability
      const bookings = await storage.getBookings({ status: 'confirmed' });
      
      // Generate all blocked dates for each booking (check-in through check-out minus 1 day)
      const allBlockedDates: string[] = [];
      
      bookings.forEach(booking => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        
        // Block from check-in date up to (but not including) check-out date
        const currentDate = new Date(checkIn);
        while (currentDate < checkOut) {
          allBlockedDates.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
      
      // Return unique blocked dates using filter to remove duplicates
      const uniqueBlockedDates = allBlockedDates.filter((date, index, self) => 
        self.indexOf(date) === index
      );
      
      res.json(uniqueBlockedDates);
    } catch (error) {
      console.error("Error fetching booking dates:", error);
      res.status(500).json({ message: "Failed to fetch booking dates" });
    }
  });

  // Get user's own bookings
  app.get('/api/user/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getBookings({ userId });
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Lookup booking by confirmation code and email (public endpoint)
  app.post('/api/bookings/lookup', async (req, res) => {
    try {
      const { confirmationCode, email } = req.body;
      
      if (!confirmationCode || !email) {
        return res.status(400).json({ message: "Confirmation code and email are required" });
      }

      const booking = await storage.getBookingByConfirmationCode(confirmationCode);
      
      if (!booking || booking.guestEmail.toLowerCase() !== email.toLowerCase()) {
        return res.status(404).json({ message: "Booking not found or email doesn't match" });
      }

      res.json(booking);
    } catch (error) {
      console.error("Error looking up booking:", error);
      res.status(500).json({ message: "Failed to lookup booking" });
    }
  });

  // Associate booking with authenticated user account
  app.post('/api/bookings/associate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      // Get the booking to verify it exists
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if booking is already associated with this user
      if (booking.userId === userId) {
        return res.status(400).json({ message: "Booking is already in your account" });
      }

      // Associate booking with user
      await storage.associateBookingWithUser(bookingId, userId);
      
      res.json({ message: "Booking added to your account successfully" });
    } catch (error) {
      console.error("Error associating booking:", error);
      res.status(500).json({ message: "Failed to add booking to account" });
    }
  });

  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const filters: any = {};
      if (user?.role === 'guest') {
        filters.userId = userId;
      }
      if (req.query.status) {
        filters.status = req.query.status as string;
      }

      const bookings = await storage.getBookings(filters);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Calendar endpoint that includes both bookings AND blocks for display
  app.get('/api/bookings/calendar/:year/:month', async (req, res) => {
    try {
      const { year, month } = req.params;
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      
      console.log("🟡 SERVER: Fetching calendar data for date range:", startDate, "to", endDate);
      
      // Get ALL bookings for calendar display (including blocks)
      const allBookings = await storage.getBookingsByDateRange(startDate, endDate, true); // true = include blocks
      
      console.log("🟢 SERVER: Found", allBookings.length, "calendar items (bookings + blocks)");
      res.json(allBookings);
    } catch (error) {
      console.error("Error fetching calendar bookings:", error);
      res.status(500).json({ message: "Failed to fetch calendar data" });
    }
  });

  app.patch('/api/bookings/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { status } = req.body;
      
      await storage.updateBookingStatus(parseInt(id), status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Property images routes
  app.get('/api/property-images', async (req, res) => {
    try {
      const images = await storage.getPropertyImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching property images:", error);
      res.status(500).json({ message: "Failed to fetch property images" });
    }
  });

  app.post('/api/property-images', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const imageData = insertPropertyImageSchema.parse(req.body);
      const image = await storage.addPropertyImage(imageData);
      res.json(image);
    } catch (error: any) {
      console.error("Error adding property image:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/property-images/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deletePropertyImage(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting property image:", error);
      res.status(500).json({ message: "Failed to delete property image" });
    }
  });

  // Amenities routes
  app.get('/api/amenities', async (req, res) => {
    try {
      const amenities = await storage.getAmenities();
      res.json(amenities);
    } catch (error) {
      console.error("Error fetching amenities:", error);
      res.status(500).json({ message: "Failed to fetch amenities" });
    }
  });

  app.post('/api/amenities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const amenityData = insertAmenitySchema.parse(req.body);
      const amenity = await storage.addAmenity(amenityData);
      res.json(amenity);
    } catch (error: any) {
      console.error("Error adding amenity:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/amenities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deleteAmenity(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting amenity:", error);
      res.status(500).json({ message: "Failed to delete amenity" });
    }
  });

  // Reviews routes
  app.get('/api/reviews', async (req, res) => {
    try {
      const reviews = await storage.getReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/reviews/stats', async (req, res) => {
    try {
      const stats = await storage.getReviewStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching review stats:", error);
      res.status(500).json({ message: "Failed to fetch review stats" });
    }
  });

  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.addReview({
        ...reviewData,
        userId: req.user.claims.sub,
      });
      res.json(review);
    } catch (error: any) {
      console.error("Error adding review:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Messages routes
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.addMessage({
        ...messageData,
        userId: req.isAuthenticated() ? (req.user as any)?.claims?.sub : null,
      });

      // Broadcast new message via WebSocket
      broadcastToAdmins({
        type: 'new_message',
        data: message
      });

      res.json(message);
    } catch (error: any) {
      console.error("Error adding message:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.patch('/api/messages/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markMessageAsRead(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.put('/api/messages/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const messageId = parseInt(req.params.id);
      await storage.markMessageAsRead(messageId);
      res.json({ message: "Message marked as read" });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Admin booking status update with enhanced functionality
  app.patch('/api/bookings/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Get booking to check its date
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Security restriction: Only allow status changes for current or past bookings
      const today = new Date().toISOString().split('T')[0];
      if (booking.checkInDate > today && (status === 'checked_in' || status === 'no_show')) {
        return res.status(400).json({ 
          message: "Status changes for check-in and no-show can only be made for current or past bookings, not future bookings." 
        });
      }

      console.log(`🔵 SERVER: Updating booking ${bookingId} status to ${status}`);
      await storage.updateBookingStatus(bookingId, status);
      
      // Broadcast status update via WebSocket
      broadcastToAdmins({
        type: 'booking_status_updated',
        data: { bookingId, status }
      });

      res.json({ message: "Booking status updated successfully", bookingId, status });
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Booking postponement endpoint
  app.patch('/api/bookings/:id/postpone', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const { newCheckInDate, newCheckOutDate, newCheckInTime, newCheckOutTime } = req.body;
      
      if (!newCheckInDate || !newCheckOutDate) {
        return res.status(400).json({ message: "New check-in and check-out dates are required" });
      }

      console.log(`🔵 SERVER: Postponing booking ${bookingId} to ${newCheckInDate} - ${newCheckOutDate}`);
      
      // Get the original booking to calculate new city tax
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Calculate new city tax based on new dates
      const originalCheckIn = new Date(booking.checkInDate);
      const originalCheckOut = new Date(booking.checkOutDate);
      const newCheckIn = new Date(newCheckInDate);
      const newCheckOut = new Date(newCheckOutDate);
      
      const originalNights = Math.ceil((originalCheckOut.getTime() - originalCheckIn.getTime()) / (1000 * 60 * 60 * 24));
      const newNights = Math.ceil((newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate new city tax (€4 per person per night, max 5 nights)
      const maxTaxNights = Math.min(newNights, 5);
      const newCityTax = booking.guests * 4 * maxTaxNights;

      console.log(`🔵 SERVER: City tax recalculated from original ${originalNights} nights to ${newNights} nights, new tax: €${newCityTax}`);

      // Update booking with new dates and recalculated city tax
      await storage.postponeBooking(bookingId, {
        newCheckInDate,
        newCheckOutDate,
        newCheckInTime: newCheckInTime || "15:00",
        newCheckOutTime: newCheckOutTime || "10:00",
        newCityTax
      });
      
      // Broadcast postponement via WebSocket
      broadcastToAdmins({
        type: 'booking_postponed',
        data: { bookingId, newCheckInDate, newCheckOutDate, newCityTax }
      });

      res.json({ 
        message: "Booking postponed successfully", 
        bookingId, 
        newCheckInDate, 
        newCheckOutDate,
        newCityTax,
        originalNights,
        newNights
      });
    } catch (error) {
      console.error("Error postponing booking:", error);
      res.status(500).json({ message: "Failed to postpone booking" });
    }
  });

  // Pricing settings routes
  app.get('/api/pricing-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Return default pricing settings for now
      const defaultPricing = {
        basePrice: 150,
        cleaningFee: 25,
        petFee: 35,
        discountWeekly: 10,
        discountMonthly: 20
      };
      
      res.json(defaultPricing);
    } catch (error) {
      console.error("Error fetching pricing settings:", error);
      res.status(500).json({ message: "Failed to fetch pricing settings" });
    }
  });

  app.put('/api/pricing-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { basePrice, cleaningFee, petFee, discountWeekly, discountMonthly } = req.body;
      
      // For now, just return success - in a real app you'd store these in the database
      res.json({ 
        message: "Pricing settings updated successfully",
        basePrice,
        cleaningFee,
        petFee,
        discountWeekly,
        discountMonthly
      });
    } catch (error) {
      console.error("Error updating pricing settings:", error);
      res.status(500).json({ message: "Failed to update pricing settings" });
    }
  });

  app.get('/api/messages/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const count = await storage.getUnreadMessagesCount();
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread messages count:", error);
      res.status(500).json({ message: "Failed to fetch unread messages count" });
    }
  });

  // Promotions routes
  app.get('/api/promotions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const promotions = await storage.getPromotions();
      res.json(promotions);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  app.get('/api/promotions/active', async (req, res) => {
    try {
      const activePromotions = await storage.getActivePromotions();
      res.json(activePromotions);
    } catch (error) {
      console.error("Error fetching active promotions:", error);
      res.status(500).json({ message: "Failed to fetch active promotions" });
    }
  });

  app.post('/api/promotions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Validate required fields
      const { name, tag, discountPercentage, startDate, endDate, description } = req.body;
      
      if (!name || !tag || !discountPercentage || !startDate || !endDate) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      if (start >= end) {
        return res.status(400).json({ message: "End date must be after start date" });
      }

      const promotionData = {
        name,
        tag,
        discountPercentage: parseInt(discountPercentage),
        startDate: start,
        endDate: end,
        description: description || "",
        isActive: req.body.isActive !== false,
      };

      const promotion = await storage.addPromotion(promotionData);
      res.json(promotion);
    } catch (error) {
      console.error("Error creating promotion:", error);
      res.status(500).json({ message: "Failed to create promotion" });
    }
  });

  app.put('/api/promotions/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      await storage.updatePromotionStatus(id, isActive);
      res.json({ message: "Promotion status updated successfully" });
    } catch (error) {
      console.error("Error updating promotion status:", error);
      res.status(500).json({ message: "Failed to update promotion status" });
    }
  });

  app.delete('/api/promotions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deletePromotion(id);
      res.json({ message: "Promotion deleted successfully" });
    } catch (error) {
      console.error("Error deleting promotion:", error);
      res.status(500).json({ message: "Failed to delete promotion" });
    }
  });

  // Hero images routes
  app.get('/api/hero-images', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const images = await storage.getHeroImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching hero images:", error);
      res.status(500).json({ message: "Failed to fetch hero images" });
    }
  });

  app.get('/api/hero-images/active', async (req, res) => {
    try {
      const activeImages = await storage.getActiveHeroImages();
      res.json(activeImages);
    } catch (error) {
      console.error("Error fetching active hero images:", error);
      res.status(500).json({ message: "Failed to fetch active hero images" });
    }
  });

  // File upload endpoint for hero images
  app.post('/api/hero-images/upload', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }

      const { title, alt, position, isActive, displayOrder } = req.body;
      
      if (!title || !alt || !position) {
        return res.status(400).json({ message: "Title, alt text, and position are required" });
      }

      // Create the image URL for serving
      const imageUrl = `/uploads/${req.file.filename}`;
      
      const imageData = {
        url: imageUrl,
        title,
        alt,
        position,
        isActive: isActive === 'true',
        displayOrder: parseInt(displayOrder) || 0,
      };

      const image = await storage.addHeroImage(imageData);
      res.json(image);
    } catch (error) {
      console.error("Error uploading hero image:", error);
      
      // Clean up uploaded file if database save failed
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }
      
      res.status(500).json({ message: "Failed to upload hero image" });
    }
  });

  app.post('/api/hero-images', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { url, alt, title, position } = req.body;
      
      if (!url || !alt || !title || !position) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const imageData = {
        url,
        alt,
        title,
        position,
        isActive: req.body.isActive !== false,
        displayOrder: req.body.displayOrder || 0,
      };

      const image = await storage.addHeroImage(imageData);
      res.json(image);
    } catch (error) {
      console.error("Error creating hero image:", error);
      res.status(500).json({ message: "Failed to create hero image" });
    }
  });

  // Batch reorder hero images (must come before /:id routes)
  app.put("/api/hero-images/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { updates } = req.body;
      console.log("Received reorder updates:", updates);
      
      if (!Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates must be an array" });
      }

      // Update each image's display order
      for (const update of updates) {
        const { id, displayOrder } = update;
        console.log(`Updating image ${id} to displayOrder ${displayOrder}`);
        
        if (typeof id === 'number' && typeof displayOrder === 'number' && !isNaN(id) && !isNaN(displayOrder)) {
          await storage.updateHeroImageOrder(id, displayOrder);
        } else {
          console.error(`Invalid update data: id=${id} (${typeof id}), displayOrder=${displayOrder} (${typeof displayOrder})`);
        }
      }

      res.json({ message: "Image order updated successfully" });
    } catch (error: any) {
      console.error("Error reordering hero images:", error);
      res.status(500).json({ message: "Failed to reorder images" });
    }
  });

  app.put('/api/hero-images/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.updateHeroImage(id, req.body);
      res.json({ message: "Hero image updated successfully" });
    } catch (error) {
      console.error("Error updating hero image:", error);
      res.status(500).json({ message: "Failed to update hero image" });
    }
  });

  app.delete('/api/hero-images/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteHeroImage(id);
      res.json({ message: "Hero image deleted successfully" });
    } catch (error) {
      console.error("Error deleting hero image:", error);
      res.status(500).json({ message: "Failed to delete hero image" });
    }
  });

  // About content routes
  app.get('/api/about-content', async (req, res) => {
    try {
      const content = await storage.getAboutContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching about content:", error);
      res.status(500).json({ message: "Failed to fetch about content" });
    }
  });

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Activity timeline routes
  app.get('/api/activity-timeline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const timeline = await storage.getActivityTimeline();
      res.json(timeline);
    } catch (error) {
      console.error("Error fetching activity timeline:", error);
      res.status(500).json({ message: "Failed to fetch activity timeline" });
    }
  });

  app.post('/api/activity-timeline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const timelineData = req.body;
      const timeline = await storage.addActivityTimeline(timelineData);
      res.json(timeline);
    } catch (error: any) {
      console.error("Error adding activity timeline:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Users management routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const usersWithDetails = await storage.getAllUsersWithDetails();
      res.json(usersWithDetails);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin block dates route
  app.post('/api/admin/block-dates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { startDate, endDate, reason } = req.body;
      
      if (!startDate || !endDate || !reason) {
        return res.status(400).json({ message: "Start date, end date, and reason are required" });
      }

      // Create blocked booking entry
      const blockedBooking = await storage.createBooking({
        guestFirstName: 'Blocked',
        guestLastName: 'Period',
        guestEmail: 'admin@allarco.com',
        guestCountry: 'IT',
        guestPhone: '+390000000000',
        checkInDate: startDate,
        checkOutDate: endDate,
        guests: 1,
        paymentMethod: 'property',
        createdBy: 'admin',
        userId: userId,
        referralCode: undefined
      });

      // Broadcast to all connected clients
      broadcastToAdmins({
        type: 'dates_blocked',
        data: {
          startDate,
          endDate,
          reason,
          booking: blockedBooking
        }
      });

      res.json({ success: true, booking: blockedBooking });
    } catch (error) {
      console.error("Error blocking dates:", error);
      res.status(500).json({ message: "Failed to block dates" });
    }
  });

  // Enhanced Stripe payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, bookingId, type = 'full_payment' } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "eur",
        metadata: {
          bookingId: bookingId?.toString() || '',
          type
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error('Payment intent creation failed:', error);
      res.status(500).json({ 
        message: 'Failed to create payment intent: ' + error.message 
      });
    }
  });

  // Card authorization for property payment
  app.post('/api/authorize-card', async (req, res) => {
    try {
      const { bookingId, amount = 100 } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // €100 authorization in cents
        currency: 'eur',
        capture_method: 'manual', // Only authorize, don't capture
        metadata: {
          bookingId: bookingId?.toString() || '',
          type: 'authorization'
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        authorizationId: paymentIntent.id,
        amount: amount
      });
    } catch (error: any) {
      console.error('Card authorization failed:', error);
      res.status(500).json({ 
        message: 'Failed to authorize card: ' + error.message 
      });
    }
  });

  app.post("/api/create-card-authorization", async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "eur",
        capture_method: "manual", // This creates an authorization
        automatic_payment_methods: {
          enabled: true,
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating card authorization: " + error.message });
    }
  });

  // Stripe webhook handler for payment confirmation
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle payment success events
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const bookingId = paymentIntent.metadata.bookingId;
      
      if (bookingId && paymentIntent.metadata.type === 'full_payment') {
        try {
          // Confirm the booking when payment succeeds
          await storage.confirmBooking(parseInt(bookingId));
          console.log(`Booking ${bookingId} confirmed after successful payment`);
        } catch (error) {
          console.error(`Failed to confirm booking ${bookingId}:`, error);
        }
      }
    }

    res.json({ received: true });
  });

  // Payment success confirmation endpoint (client-side confirmation)
  app.post('/api/confirm-payment', async (req, res) => {
    try {
      const { paymentIntentId, bookingId } = req.body;
      
      // Verify payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded' && bookingId) {
        await storage.confirmBooking(bookingId);
        res.json({ success: true, message: 'Booking confirmed' });
      } else {
        res.status(400).json({ success: false, message: 'Payment not completed' });
      }
    } catch (error: any) {
      console.error('Payment confirmation failed:', error);
      res.status(500).json({ success: false, message: 'Failed to confirm payment' });
    }
  });

  const httpServer = createServer(app);

  // Periodic cleanup of abandoned pending bookings (every 10 minutes)
  setInterval(async () => {
    try {
      await storage.cleanupAbandonedBookings();
      console.log('Cleaned up abandoned pending bookings');
    } catch (error) {
      console.error('Failed to cleanup abandoned bookings:', error);
    }
  }, 10 * 60 * 1000); // 10 minutes

  // WebSocket setup for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const adminConnections = new Set<WebSocket>();

  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    // Add to admin connections (in a real app, verify admin role)
    adminConnections.add(ws);
    
    ws.on('close', () => {
      adminConnections.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      adminConnections.delete(ws);
    });
  });

  // Undo no-show status (revert to confirmed)
  app.post('/api/bookings/:id/undo-no-show', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.status !== 'no_show') {
        return res.status(400).json({ message: "Booking is not marked as no-show" });
      }

      await storage.updateBookingStatus(bookingId, 'confirmed');
      
      // Add activity timeline entry
      await storage.addActivityTimeline({
        guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
        description: `No-show status reverted to confirmed for booking #${bookingId}`,
        actionType: 'booking_status_reverted',
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guestEmail: booking.guestEmail,
        bookingId: bookingId,
        totalPrice: booking.totalPrice.toString()
      });

      res.json({ message: "No-show status reverted successfully" });
    } catch (error) {
      console.error("Error undoing no-show:", error);
      res.status(500).json({ message: "Failed to undo no-show status" });
    }
  });

  // Edit booking dates
  app.put('/api/bookings/:id/edit-dates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const { newCheckInDate, newCheckOutDate } = req.body;
      
      if (!newCheckInDate || !newCheckOutDate) {
        return res.status(400).json({ message: "New check-in and check-out dates are required" });
      }

      // Check if new dates are available
      const conflictingBookings = await storage.checkBookingConflicts(newCheckInDate, newCheckOutDate, bookingId);
      
      if (conflictingBookings.length > 0) {
        return res.status(400).json({ 
          message: "Selected dates are not available",
          conflicts: conflictingBookings 
        });
      }

      const oldBooking = await storage.getBooking(bookingId);
      if (!oldBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      await storage.updateBookingDates(bookingId, newCheckInDate, newCheckOutDate);
      
      // Add activity timeline entry
      await storage.addActivityTimeline({
        actionType: 'booking_dates_changed',
        description: `Booking dates changed from ${oldBooking.checkInDate} - ${oldBooking.checkOutDate} to ${newCheckInDate} - ${newCheckOutDate}`,
        guestName: `${oldBooking.guestFirstName} ${oldBooking.guestLastName}`,
        bookingId: bookingId,
        totalPrice: oldBooking.totalPrice.toString(),
        guestEmail: oldBooking.guestEmail,
        checkInDate: newCheckInDate,
        checkOutDate: newCheckOutDate
      });

      res.json({ message: "Booking dates updated successfully" });
    } catch (error) {
      console.error("Error editing booking dates:", error);
      res.status(500).json({ message: "Failed to edit booking dates" });
    }
  });

  // Delete booking (cancel and free dates)
  app.delete('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update booking status to cancelled instead of deleting
      await storage.updateBookingStatus(bookingId, 'cancelled');
      
      // Add activity timeline entry
      await storage.addActivityTimeline({
        actionType: 'booking_cancelled',
        description: `Booking #${bookingId} cancelled by admin - dates now available for new bookings`,
        guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
        bookingId: bookingId,
        totalPrice: booking.totalPrice.toString(),
        guestEmail: booking.guestEmail,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate
      });

      res.json({ message: "Booking cancelled successfully - dates are now available" });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Broadcast function for admin notifications
  function broadcastToAdmins(message: any) {
    const messageStr = JSON.stringify(message);
    adminConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  // Real-time calendar updates (every 100ms as requested)
  setInterval(async () => {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      const bookings = await storage.getBookingsByDateRange(startDate, endDate);
      
      broadcastToAdmins({
        type: 'calendar_update',
        data: { bookings, year, month }
      });
    } catch (error) {
      console.error('Error in calendar update broadcast:', error);
    }
  }, 100);

  return httpServer;
}
