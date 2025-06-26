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
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  // Local logout route
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logout successful" });
    });
  });

  // Booking routes
  app.post('/api/bookings', async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Check availability
      const isAvailable = await storage.checkAvailability(
        bookingData.checkInDate,
        bookingData.checkOutDate
      );
      
      if (!isAvailable) {
        return res.status(400).json({ message: "Selected dates are not available" });
      }

      // Validate payment method based on user role
      const userRole = req.isAuthenticated() ? 
        (await storage.getUser((req.user as any)?.claims?.sub))?.role || 'guest' : 'guest';
      
      const guestPaymentMethods = ['online', 'at_property_card_auth'];
      const adminPaymentMethods = ['admin_manual_card', 'admin_pay_at_property', 'admin_city_tax_only'];
      
      if (userRole === 'guest' && !guestPaymentMethods.includes(bookingData.paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method for guests" });
      }
      
      if (userRole === 'admin' && !adminPaymentMethods.includes(bookingData.paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method for admin" });
      }

      const booking = await storage.createBooking({
        ...bookingData,
        userId: req.isAuthenticated() ? (req.user as any)?.claims?.sub : null,
      });

      // Broadcast new booking via WebSocket
      broadcastToAdmins({
        type: 'new_booking',
        data: booking
      });

      res.json(booking);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      res.status(400).json({ message: error.message });
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

  app.get('/api/bookings/calendar/:year/:month', async (req, res) => {
    try {
      const { year, month } = req.params;
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      
      const bookings = await storage.getBookingsByDateRange(startDate, endDate);
      res.json(bookings);
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

  // Admin booking status update
  app.put('/api/bookings/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.updateBookingStatus(bookingId, status);
      res.json({ message: "Booking status updated successfully" });
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
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

  // Stripe payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "eur",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
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

  const httpServer = createServer(app);

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
