import {
  users,
  bookings,
  propertyImages,
  amenities,
  reviews,
  messages,
  aboutContent,
  promotions,
  promoCodes,
  promoCodeUsage,
  vouchers,
  voucherUsage,
  pricingSettings,
  heroImages,
  activityTimeline,

  type User,
  type UpsertUser,
  type InsertBooking,
  type Booking,
  type InsertPropertyImage,
  type PropertyImage,
  type InsertAmenity,
  type Amenity,
  type InsertReview,
  type Review,
  type InsertMessage,
  type Message,
  type InsertAboutContent,
  type AboutContent,
  type InsertPromotion,
  type Promotion,
  type InsertPromoCode,
  type PromoCode,
  type InsertPromoCodeUsage,
  type PromoCodeUsage,
  type InsertPricingSettings,
  type PricingSettings,
  type InsertHeroImage,
  type HeroImage,
  type InsertActivityTimeline,
  type ActivityTimeline,
} from "../shared/schema";
// PMS imports removed - not available in current schema
import { db } from "./db";
import { eq, desc, and, or, gte, lte, lt, gt, count, sql, not, ne } from "drizzle-orm";

// Temporary PMS type definitions
interface PMSIntegration {
  id: string;
  name: string;
  platform: string;
  status: string;
  lastSync: Date;
  createdAt: Date;
  updatedAt: Date;
  bookingsCount: number;
}

interface InsertPMSIntegration {
  id: string;
  name: string;
  platform: string;
  status: string;
  lastSync: Date;
  createdAt: Date;
  updatedAt: Date;
  bookingsCount: number;
}

interface PMSBooking {
  id: string;
  start: Date;
  end: Date;
  guestName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertPMSBooking {
  id: string;
  start: Date;
  end: Date;
  guestName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PMSReview {
  id: string;
  date: Date;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertPMSReview {
  id: string;
  date: Date;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PMSMessage {
  id: string;
  timestamp: Date;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertPMSMessage {
  id: string;
  timestamp: Date;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createLocalUser(userData: { firstName: string; lastName: string; email: string; password: string; referralCode?: string }): Promise<User>;
  createAdminUser(userData: { firstName: string; lastName: string; email: string; password: string }): Promise<User>;
  createUser(userData: { firstName: string; lastName: string; email: string; password?: string; profileImageUrl?: string; provider?: string; providerId?: string; role?: string }): Promise<User>;
  incrementReferralCount(userId: string): Promise<void>;
  updateUserProfile(userId: string, data: Partial<User>): Promise<User>;
  updateUser(userId: string, data: Partial<User>): Promise<User>;
  deductUserCredits(userId: string, amount: number): Promise<void>;
  addUserCredits(userId: string, amount: number): Promise<void>;
  getAllUsersWithDetails(): Promise<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth?: string;
    country?: string;
    mobileNumber?: string;
    referralCode: string;
    totalReferrals: number;
    referredBy?: string;
    referrerName?: string;
    credits: number;
    provider: string;
    totalBookings: number;
    totalSpent: number;
    isRegistered: boolean;
  }>>;
  
  // Booking operations with comprehensive pricing
  createBooking(bookingData: {
    guestFirstName: string;
    guestLastName: string;
    guestEmail: string;
    guestCountry: string;
    guestPhone: string;
    checkInDate: string;
    checkOutDate: string;
    checkInTime?: string;
    checkOutTime?: string;
    guests: number;
    paymentMethod: "online" | "property";
    hasPet?: boolean;
    referralCode?: string;
    promoCode?: string;
    voucherCode?: string;
    creditsUsed?: number;
    createdBy?: "admin" | "guest";
    bookedForSelf?: boolean;
    userId?: string;
    blockReason?: string;
    bookingSource?: "direct" | "airbnb" | "booking.com" | "custom" | "blocked";
  }): Promise<Booking>;
  getBookings(filters?: { status?: string; userId?: string }): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByConfirmationCode(code: string): Promise<Booking | undefined>;
  updateBookingStatus(id: number, status: string): Promise<void>;
  confirmBooking(id: number): Promise<void>;
  cleanupAbandonedBookings(): Promise<void>;
  checkAvailability(checkIn: string, checkOut: string, excludeBookingId?: number): Promise<boolean>;
  getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]>;
  associateBookingWithUser(bookingId: number, userId: string): Promise<void>;
  calculateBookingPricing(checkIn: string, checkOut: string, guests: number, hasPet: boolean, referralCode?: string, promoCode?: string, voucherCode?: string): Promise<{
    basePrice: number;
    totalNights: number;
    priceBeforeDiscount: number;
    lengthOfStayDiscount: number;
    lengthOfStayDiscountPercent: number;
    priceAfterDiscount: number;
    cleaningFee: number;
    serviceFee: number;
    petFee: number;
    cityTax: number;
    referralCredit: number;
    promoCodeDiscount: number;
    promoCodeDiscountPercent: number;
    appliedPromoCode: string | null;
    voucherDiscount: number;
    appliedVoucher: string | null;
    totalPrice: number;
    promotionDiscount: number;
    promotionDiscountPercent: number;
    activePromotion: string | null;
    originalPrice: number;
  }>;
  
  // Property image operations
  getPropertyImages(): Promise<PropertyImage[]>;
  addPropertyImage(image: InsertPropertyImage): Promise<PropertyImage>;
  deletePropertyImage(id: number): Promise<void>;
  updateImageOrder(id: number, order: number): Promise<void>;
  
  // Amenities operations
  getAmenities(): Promise<Amenity[]>;
  addAmenity(amenity: InsertAmenity): Promise<Amenity>;
  deleteAmenity(id: number): Promise<void>;
  updateAmenityOrder(id: number, order: number): Promise<void>;
  
  // Reviews operations
  getReviews(): Promise<Review[]>;
  getAllReviews(): Promise<Review[]>;
  addReview(review: InsertReview): Promise<Review>;
  addGuestReview(review: any): Promise<Review>;
  getReviewByBookingAndEmail(bookingId: number, guestEmail: string): Promise<Review | null>;
  getReviewByBookingId(bookingId: number): Promise<Review | null>;
  approveReview(reviewId: number): Promise<Review>;
  rejectReview(reviewId: number, reason?: string): Promise<Review>;
  getPendingReviews(): Promise<Review[]>;
  getReviewStats(): Promise<{
    averageRating: number;
    totalCount: number;
    cleanlinessAvg: number;
    locationAvg: number;
    checkinAvg: number;
    valueAvg: number;
    communicationAvg: number;
  }>;
  
  // Messages operations
  getMessages(isFromAdmin?: boolean): Promise<Message[]>;
  addMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<void>;
  getUnreadMessagesCount(): Promise<number>;
  
  // About content operations
  getAboutContent(): Promise<AboutContent[]>;
  updateAboutContent(id: number, content: Partial<AboutContent>): Promise<void>;
  
  // Analytics
  getAnalytics(): Promise<{
    totalBookings: number;
    totalRevenue: number;
    occupancyRate: number;
    averageRating: number;
  }>;
  
  // Referral analytics
  getUserReferralStats(userId: string): Promise<{
    totalReferrals: number;
    referredBy: string | null;
    referrerName: string | null;
    referralCode: string;
  }>;

  // Promotions operations
  getPromotions(): Promise<Promotion[]>;
  getActivePromotions(): Promise<Promotion[]>;
  addPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotionStatus(id: number, isActive: boolean): Promise<void>;
  deletePromotion(id: number): Promise<void>;

  // Promo codes operations
  getPromoCodes(): Promise<PromoCode[]>;
  createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode>;
  deletePromoCode(id: number): Promise<void>;
  validatePromoCode(code: string): Promise<PromoCode | null>;
  recordPromoCodeUsage(usage: InsertPromoCodeUsage): Promise<PromoCodeUsage>;
  getPromoCodeUsage(promoCodeId: number): Promise<PromoCodeUsage[]>;
  getPromoCodeWithUsage(promoCodeId: number): Promise<{ promoCode: PromoCode; usage: PromoCodeUsage[] } | null>;

  // Pricing settings operations
  getPricingSettings(): Promise<PricingSettings | undefined>;
  updatePricingSettings(settings: InsertPricingSettings): Promise<PricingSettings>;

  // Hero images operations
  getHeroImages(): Promise<HeroImage[]>;
  getActiveHeroImages(): Promise<HeroImage[]>;
  addHeroImage(image: InsertHeroImage): Promise<HeroImage>;
  updateHeroImage(id: number, data: Partial<HeroImage>): Promise<void>;
  deleteHeroImage(id: number): Promise<void>;
  updateHeroImageOrder(id: number, displayOrder: number): Promise<void>;

  // Activity timeline operations
  getActivityTimeline(): Promise<ActivityTimeline[]>;
  addActivityTimeline(timeline: InsertActivityTimeline): Promise<ActivityTimeline>;
  
  // PMS operations
  getPMSIntegrations(): Promise<PMSIntegration[]>;
  createPMSIntegration(integration: Omit<InsertPMSIntegration, 'id' | 'createdAt' | 'updatedAt'>): Promise<PMSIntegration>;
  getPMSIntegration(id: string): Promise<PMSIntegration | undefined>;
  deletePMSIntegration(id: string): Promise<void>;
  updatePMSIntegrationSync(id: string): Promise<void>;
  updatePMSIntegrationStatus(id: string, status: string): Promise<void>;
  updatePMSIntegrationBookingCount(id: string, count: number): Promise<void>;
  
  getPMSBookings(): Promise<PMSBooking[]>;
  createPMSBooking(booking: Omit<InsertPMSBooking, 'id' | 'createdAt' | 'updatedAt'>): Promise<PMSBooking>;
  
  getPMSReviews(): Promise<PMSReview[]>;
  createPMSReview(review: Omit<InsertPMSReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<PMSReview>;
  
  getPMSMessages(): Promise<PMSMessage[]>;
  createPMSMessage(message: Omit<InsertPMSMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<PMSMessage>;
  markPMSMessageAsRead(id: string): Promise<void>;
  
  // Team Management operations
  getAllRoles(): Promise<any[]>;
  getAllTeamMembers(): Promise<any[]>;
  createTeamMember(data: any): Promise<any>;
  getTeamMemberByUserId(userId: string): Promise<any | null>;
  updateTeamMember(id: string, updateData: any): Promise<any>;
  updateTeamMemberStatus(id: string, isActive: boolean): Promise<void>;
  deleteTeamMember(id: string): Promise<void>;
  resetTeamMemberPassword(id: string): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      password: users.password,
      dateOfBirth: users.dateOfBirth,
      country: users.country,
      mobileNumber: users.mobileNumber,
      referralCode: users.referralCode,
      referredBy: users.referredBy,
      referrerName: users.referrerName,
      totalReferrals: users.totalReferrals,
      accountCredits: users.accountCredits,
      authProvider: users.authProvider,
      providerId: users.providerId,
      role: users.role,
      totpSecret: users.totpSecret,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdBy: users.createdBy,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, id));
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      password: users.password,
      dateOfBirth: users.dateOfBirth,
      country: users.country,
      mobileNumber: users.mobileNumber,
      referralCode: users.referralCode,
      referredBy: users.referredBy,
      referrerName: users.referrerName,
      totalReferrals: users.totalReferrals,
      accountCredits: users.accountCredits,
      authProvider: users.authProvider,
      providerId: users.providerId,
      role: users.role,
      // Include columns that now exist in database after migration
      totpSecret: users.totpSecret,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdBy: users.createdBy,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.email, email));
    
    return user;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      password: users.password,
      dateOfBirth: users.dateOfBirth,
      country: users.country,
      mobileNumber: users.mobileNumber,
      referralCode: users.referralCode,
      referredBy: users.referredBy,
      referrerName: users.referrerName,
      totalReferrals: users.totalReferrals,
      accountCredits: users.accountCredits,
      authProvider: users.authProvider,
      providerId: users.providerId,
      role: users.role,
      totpSecret: users.totpSecret,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdBy: users.createdBy,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.referralCode, referralCode));
    
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createLocalUser(userData: { firstName: string; lastName: string; email: string; password: string; referralCode?: string }): Promise<User> {
    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate unique referral code for new user
    let newReferralCode: string;
    let isUnique = false;
    
    while (!isUnique) {
      newReferralCode = `${userData.firstName.substring(0, 2).toUpperCase()}${userData.lastName.substring(0, 2).toUpperCase()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const existingUser = await this.getUserByReferralCode(newReferralCode);
      if (!existingUser) {
        isUnique = true;
      }
    }

    // Validate referral code if provided and get referrer info
    let referredBy: string | undefined;
    let referrerName: string | undefined;
    if (userData.referralCode) {
      const referrer = await this.getUserByReferralCode(userData.referralCode);
      if (referrer) {
        referredBy = userData.referralCode; // Store the referral code, not ID
        referrerName = `${referrer.firstName} ${referrer.lastName}`;
        // Increment referrer's total referrals count
        await this.incrementReferralCount(referrer.id);
      }
    }

    const [user] = await db
      .insert(users)
      .values({
        id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password,
        referralCode: newReferralCode!,
        referredBy,
        referrerName,
        authProvider: "local",
        role: "guest",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async createAdminUser(userData: { firstName: string; lastName: string; email: string; password: string }): Promise<User> {
    const id = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate a unique referral code for admin
    let newReferralCode: string | undefined;
    let isUnique = false;
    while (!isUnique) {
      newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingUser = await this.getUserByReferralCode(newReferralCode);
      if (!existingUser) {
        isUnique = true;
      }
    }

    const [user] = await db
      .insert(users)
      .values({
        id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password,
        referralCode: newReferralCode!,
        authProvider: "local",
        role: "admin", // Set role as admin
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async createUser(userData: { firstName: string; lastName: string; email: string; password?: string; profileImageUrl?: string; provider?: string; providerId?: string; role?: string }): Promise<User> {
    const provider = userData.provider || "local";
    const id = `${provider}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate a unique referral code for new user
    let newReferralCode: string;
    let isUnique = false;
    
    while (!isUnique) {
      newReferralCode = `${userData.firstName.substring(0, 2).toUpperCase()}${userData.lastName.substring(0, 2).toUpperCase()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const existingUser = await this.getUserByReferralCode(newReferralCode);
      if (!existingUser) {
        isUnique = true;
      }
    }

    const [user] = await db
      .insert(users)
      .values({
        id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password || "", // Empty password for OAuth users
        profileImageUrl: userData.profileImageUrl,
        referralCode: newReferralCode!,
        authProvider: provider as "local" | "google" | "replit",
        providerId: userData.providerId,
        role: userData.role as "guest" | "admin" | "team_member" || "guest",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async incrementReferralCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        totalReferrals: sql`${users.totalReferrals} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async deductUserCredits(userId: string, amount: number): Promise<void> {
    await db
      .update(users)
      .set({
        accountCredits: sql`${users.accountCredits} - ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async addUserCredits(userId: string, amount: number): Promise<void> {
    await db
      .update(users)
      .set({
        accountCredits: sql`${users.accountCredits} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Booking operations
  async createBooking(bookingData: {
    guestFirstName: string;
    guestLastName: string;
    guestEmail: string;
    guestCountry: string;
    guestPhone: string;
    checkInDate: string;
    checkOutDate: string;
    checkInTime?: string;
    checkOutTime?: string;
    guests: number;
    paymentMethod: "online" | "property";
    hasPet?: boolean;
    referralCode?: string;
    promoCode?: string;
    voucherCode?: string;
    creditsUsed?: number;
    createdBy?: "admin" | "guest";
    bookedForSelf?: boolean;
    userId?: string;
    blockReason?: string;
    bookingSource?: "direct" | "airbnb" | "booking.com" | "custom" | "blocked";
  }): Promise<Booking> {
    // Calculate comprehensive pricing
    const pricing = await this.calculateBookingPricing(
      bookingData.checkInDate,
      bookingData.checkOutDate,
      bookingData.guests,
      bookingData.hasPet || false,
      bookingData.referralCode,
      bookingData.promoCode,
      bookingData.voucherCode
    );

    // Handle referral user lookup
    let referredByUserId = null;
    if (bookingData.referralCode) {
      const referrer = await this.getUserByReferralCode(bookingData.referralCode);
      if (referrer) {
        referredByUserId = referrer.id;
        // Increment referrer's referral count
        await this.incrementReferralCount(referrer.id);
      }
    }

    // Handle user credits deduction if credits are used
    if (bookingData.creditsUsed && bookingData.creditsUsed > 0 && bookingData.userId) {
      await this.deductUserCredits(bookingData.userId, bookingData.creditsUsed);
    }

    // Generate unique confirmation code and QR code
    const confirmationCode = this.generateConfirmationCode();
    const qrCode = this.generateQRCode(confirmationCode);

    const [booking] = await db
      .insert(bookings)
      .values({
        // Guest information
        guestFirstName: bookingData.guestFirstName,
        guestLastName: bookingData.guestLastName,
        guestEmail: bookingData.guestEmail,
        guestCountry: bookingData.guestCountry,
        guestPhone: bookingData.guestPhone,
        
        // Booking details
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        checkInTime: bookingData.checkInTime || "15:00",
        checkOutTime: bookingData.checkOutTime || "10:00",
        guests: bookingData.guests,
        
        // Pricing breakdown
        basePrice: pricing.basePrice.toString(),
        totalNights: pricing.totalNights,
        priceBeforeDiscount: pricing.priceBeforeDiscount.toString(),
        priceAfterDiscount: pricing.priceAfterDiscount.toString(),
        cleaningFee: pricing.cleaningFee.toString(),
        serviceFee: pricing.serviceFee.toString(),
        petFee: pricing.petFee.toString(),
        cityTax: pricing.cityTax.toString(),
        
        // Discounts and credits
        lengthOfStayDiscount: pricing.lengthOfStayDiscount.toString(),
        lengthOfStayDiscountPercent: pricing.lengthOfStayDiscountPercent,
        referralCredit: pricing.referralCredit.toString(),
        
        // Promotion and voucher discounts
        promotionDiscount: pricing.promotionDiscount.toString(),
        promotionDiscountPercent: pricing.promotionDiscountPercent,
        activePromotion: pricing.activePromotion || null,
        promoCodeDiscount: pricing.promoCodeDiscount.toString(),
        promoCodeDiscountPercent: pricing.promoCodeDiscountPercent,
        appliedPromoCode: pricing.appliedPromoCode || null,
        voucherDiscount: pricing.voucherDiscount.toString(),
        appliedVoucher: pricing.appliedVoucher || null,
        
        totalDiscountAmount: pricing.totalDiscountAmount.toString(),
        
        // Final pricing
        totalPrice: pricing.totalPrice.toString(),
        
        // Payment and booking tracking
        paymentMethod: bookingData.paymentMethod,
        createdBy: bookingData.createdBy || "guest",
        bookedForSelf: bookingData.bookedForSelf ?? true,
        
        // User associations
        userId: bookingData.userId || null,
        referredByUserId,
        
        // Unique identifiers
        confirmationCode,
        qrCode,
        
        // Booking source and blocking
        bookingSource: bookingData.bookingSource || (bookingData.blockReason ? "blocked" : "direct"),
        blockReason: bookingData.blockReason || null,
        
        // Status - pending for online payment, confirmed for property payment
        status: bookingData.paymentMethod === "online" ? "pending" : "confirmed",
        paymentStatus: bookingData.paymentMethod === "online" ? "pending" : "not_required",
      })
      .returning();
    
    // Record promo code usage if a promo code was applied
    if (bookingData.promoCode && pricing.appliedPromoCode) {
      const validPromoCode = await this.validatePromoCode(bookingData.promoCode.toUpperCase());
      if (validPromoCode) {
        await this.recordPromoCodeUsage({
          promoCodeId: validPromoCode.id,
          bookingId: booking.id,
          userId: bookingData.userId || null,
          guestEmail: bookingData.guestEmail,
          guestName: `${bookingData.guestFirstName} ${bookingData.guestLastName}`,
          discountAmount: pricing.promoCodeDiscount.toString(),
        });
      }
    }
    
    // Record voucher usage if a voucher was applied




    if (bookingData.voucherCode && pricing.appliedVoucher) {


      try {
        // Find the voucher by code to get its ID
        const [voucher] = await db.select().from(vouchers).where(eq(vouchers.code, bookingData.voucherCode.toUpperCase())).limit(1);
        
        if (voucher) {

          await this.recordVoucherUsage({
            voucherId: voucher.id,
            bookingId: booking.id,
            userId: bookingData.userId || null,
            guestEmail: bookingData.guestEmail,
            guestName: `${bookingData.guestFirstName} ${bookingData.guestLastName}`,
            discountAmount: pricing.voucherDiscount.toString(),
            bookingAmount: (pricing.priceBeforeDiscount + pricing.cleaningFee + pricing.serviceFee + pricing.petFee + pricing.cityTax - pricing.referralCredit).toString(),
            checkInDate: bookingData.checkInDate,
            checkOutDate: bookingData.checkOutDate,
          });

        } else {

        }
      } catch (error) {

      }
    } else {

    }
    
    return booking;
  }

  async recordVoucherUsage(usage: { voucherId: number; bookingId: number; userId: string | null; guestEmail: string; guestName: string; discountAmount: string; bookingAmount: string; checkInDate: string; checkOutDate: string; }): Promise<void> {
    // Record the usage
    await db
      .insert(voucherUsage)
      .values(usage)
      .returning();

    // Increment the usage count
    await db
      .update(vouchers)
      .set({
        usageCount: sql`${vouchers.usageCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(vouchers.id, usage.voucherId));
  }

  async getBookingByConfirmationCode(code: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.confirmationCode, code));
    return booking;
  }

  async calculateBookingPricing(
    checkIn: string, 
    checkOut: string, 
    guests: number, 
    hasPet: boolean, 
    referralCode?: string,
    promoCode?: string,
    voucherCode?: string
  ): Promise<{
    basePrice: number;
    totalNights: number;
    priceBeforeDiscount: number;
    lengthOfStayDiscount: number;
    lengthOfStayDiscountPercent: number;
    priceAfterDiscount: number;
    cleaningFee: number;
    serviceFee: number;
    petFee: number;
    cityTax: number;
    referralCredit: number;
    promoCodeDiscount: number;
    promoCodeDiscountPercent: number;
    appliedPromoCode: string | null;
    voucherDiscount: number;
    appliedVoucher: string | null;
    totalPrice: number;
    promotionDiscount: number;
    promotionDiscountPercent: number;
    activePromotion: string | null;
    totalDiscountAmount: number;
    originalPrice: number;
  }> {

    // Fetch dynamic pricing from database
    const pricingSettings = await this.getPricingSettings();
    const basePrice = parseFloat(pricingSettings?.basePrice || "110.50");
    const serviceFee = 15.00;
    
    // Calculate nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const totalNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Dynamic cleaning fee based on stay duration (configurable)
    const cleaningFeeShortStay = parseFloat(pricingSettings?.cleaningFeeShortStay || "25.00");
    const cleaningFeeLongStay = parseFloat(pricingSettings?.cleaningFeeLongStay || "35.00");
    const cleaningFee = totalNights <= 2 ? cleaningFeeShortStay : cleaningFeeLongStay;
    
    // Base pricing
    const priceBeforeDiscount = basePrice * totalNights;
    
    // Length of stay discount: 5% for 7+ days, 10% for 14+ days
    let lengthOfStayDiscountPercent = 0;
    if (totalNights >= 14) {
      lengthOfStayDiscountPercent = 10;
    } else if (totalNights >= 7) {
      lengthOfStayDiscountPercent = 5;
    }
    
    const lengthOfStayDiscount = priceBeforeDiscount * (lengthOfStayDiscountPercent / 100);
    
    // Dynamic pet cleaning fee based on stay duration (configurable, only if pet is present)
    const petFeeShortStay = parseFloat(pricingSettings?.petFeeShortStay || "15.00");
    const petFeeLongStay = parseFloat(pricingSettings?.petFeeLongStay || "25.00");
    const petFee = hasPet ? (totalNights <= 2 ? petFeeShortStay : petFeeLongStay) : 0;
    
    // City tax: 4€ per adult (16+) per night, maximum 5 nights
    const taxableNights = Math.min(totalNights, 5);
    const cityTax = guests * 4.00 * taxableNights;
    
    // Referral credit: 5€ per night for referred registered guests
    let referralCredit = 0;
    if (referralCode) {
      const referrer = await this.getUserByReferralCode(referralCode);
      if (referrer) {
        referralCredit = totalNights * 5.00; // 5€ per night
      }
    }
    
    // Check for active promotions
    const activePromotions = await this.getActivePromotions();
    let promotionDiscount = 0;
    let promotionDiscountPercent = 0;
    let activePromotion: string | null = null;
    
    if (activePromotions.length > 0) {
      // Use the highest discount promotion if multiple are active
      const bestPromotion = activePromotions.reduce((best, current) => 
        current.discountPercentage > best.discountPercentage ? current : best
      );
      
      promotionDiscountPercent = bestPromotion.discountPercentage;
      activePromotion = bestPromotion.name;
      // Apply promotion discount to the base price before other calculations
      promotionDiscount = priceBeforeDiscount * (promotionDiscountPercent / 100);
    }

    // Check for promo code discounts
    let promoCodeDiscount = 0;
    let promoCodeDiscountPercent = 0;
    let appliedPromoCode: string | null = null;
    
    if (promoCode) {
      const validPromoCode = await this.validatePromoCode(promoCode.toUpperCase());
      if (validPromoCode) {
        appliedPromoCode = validPromoCode.code;
        
        if (validPromoCode.discountType === 'percentage') {
          promoCodeDiscountPercent = Number(validPromoCode.discountValue);
          promoCodeDiscount = priceBeforeDiscount * (promoCodeDiscountPercent / 100);
          
          // Apply max discount amount if specified
          if (validPromoCode.maxDiscountAmount) {
            const maxDiscount = Number(validPromoCode.maxDiscountAmount);
            promoCodeDiscount = Math.min(promoCodeDiscount, maxDiscount);
          }
        } else if (validPromoCode.discountType === 'fixed') {
          promoCodeDiscount = Number(validPromoCode.discountValue);
        }
        
        // Check minimum order amount
        if (validPromoCode.minOrderAmount && priceBeforeDiscount < Number(validPromoCode.minOrderAmount)) {
          promoCodeDiscount = 0;
          promoCodeDiscountPercent = 0;
          appliedPromoCode = null;
        }
      }
    }
    
    // Check for voucher discounts
    let voucherDiscount = 0;
    let appliedVoucher: string | null = null;
    
    if (voucherCode) {
      // Calculate total booking amount for voucher validation (base price + fees)
      const totalBookingAmount = priceBeforeDiscount + cleaningFee + serviceFee + petFee + cityTax - referralCredit;








      const validVoucher = await this.validateVoucher(voucherCode.toUpperCase(), totalBookingAmount);

      if (validVoucher) {
        appliedVoucher = validVoucher.code;
        
        if (validVoucher.discountType === 'percentage') {
          voucherDiscount = priceBeforeDiscount * (Number(validVoucher.discountValue) / 100);
          
          // Apply max discount amount if specified
          if (validVoucher.maxDiscountAmount && Number(validVoucher.maxDiscountAmount) > 0) {
            const maxDiscount = Number(validVoucher.maxDiscountAmount);
            voucherDiscount = Math.min(voucherDiscount, maxDiscount);
          }
        } else if (validVoucher.discountType === 'fixed') {
          voucherDiscount = Number(validVoucher.discountValue);
        }

      } else {

      }
    }
    
    // Calculate price after all discounts (promotions, promo codes, vouchers)
    const totalDiscountFromPromotionsAndCodes = promotionDiscount + promoCodeDiscount + voucherDiscount;
    const priceAfterDiscount = priceBeforeDiscount - totalDiscountFromPromotionsAndCodes;
    
    // Calculate total discount amount (includes all discounts and credits)
    const totalDiscountAmount = promotionDiscount + promoCodeDiscount + voucherDiscount + lengthOfStayDiscount + referralCredit;
    
    // Final total calculation: price after discount + fees - referral credit
    const totalPrice = priceAfterDiscount + cleaningFee + serviceFee + petFee + cityTax - referralCredit;
    
    // Store original total for display purposes
    const originalPrice = priceBeforeDiscount + cleaningFee + serviceFee + petFee + cityTax;





    return {
      basePrice,
      totalNights,
      priceBeforeDiscount,
      lengthOfStayDiscount,
      lengthOfStayDiscountPercent,
      priceAfterDiscount,
      cleaningFee,
      serviceFee,
      petFee,
      cityTax,
      referralCredit,
      promoCodeDiscount,
      promoCodeDiscountPercent,
      appliedPromoCode,
      voucherDiscount,
      appliedVoucher,
      totalPrice: Math.max(0, totalPrice), // Ensure non-negative
      promotionDiscount,
      promotionDiscountPercent,
      activePromotion,
      totalDiscountAmount,
      originalPrice: Math.max(0, originalPrice)
    };
  }

  private generateConfirmationCode(): string {
    // Generate ARCO-prefixed confirmation code with 6 random characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'ARCO';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateQRCode(confirmationCode: string): string {
    // Generate QR code data (would typically use a QR code library)
    return `https://allarco.com/booking/${confirmationCode}`;
  }

  async getBookings(filters?: { status?: string; userId?: string }): Promise<Booking[]> {
    let conditions = [];
    
    // Always exclude blocked dates from booking listings (they're administrative blocks)
    conditions.push(or(
      eq(bookings.bookingSource, "direct"),
      eq(bookings.bookingSource, "airbnb"), 
      eq(bookings.bookingSource, "booking.com"),
      eq(bookings.bookingSource, "custom")
    ));
    
    if (filters?.status) {
      conditions.push(eq(bookings.status, filters.status as any));
    }
    
    if (filters?.userId) {
      conditions.push(eq(bookings.userId, filters.userId));
    }
    
    const query = db.select().from(bookings).where(and(...conditions));
    
    return await query.orderBy(desc(bookings.createdAt));
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<void> {
    await db
      .update(bookings)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(bookings.id, id));
  }

  async checkBookingConflicts(checkInDate: string, checkOutDate: string, excludeBookingId?: number): Promise<any[]> {
    const conditions = [
      sql`${bookings.status} != 'cancelled'`, // Don't consider cancelled bookings
      or(
        and(
          sql`${bookings.checkInDate} <= ${checkInDate}`,
          sql`${bookings.checkOutDate} > ${checkInDate}`
        ),
        and(
          sql`${bookings.checkInDate} < ${checkOutDate}`,
          sql`${bookings.checkOutDate} >= ${checkOutDate}`
        ),
        and(
          sql`${bookings.checkInDate} >= ${checkInDate}`,
          sql`${bookings.checkOutDate} <= ${checkOutDate}`
        )
      )
    ];

    if (excludeBookingId) {
      conditions.push(sql`${bookings.id} != ${excludeBookingId}`);
    }

    return await db.select().from(bookings).where(and(...conditions));
  }

  async updateBookingDates(bookingId: number, newCheckInDate: string, newCheckOutDate: string): Promise<void> {
    await db
      .update(bookings)
      .set({ 
        checkInDate: newCheckInDate,
        checkOutDate: newCheckOutDate,
        modificationDate: new Date()
      })
      .where(eq(bookings.id, bookingId));
  }


  async getBookingById(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async postponeBooking(id: number, data: {
    newCheckInDate: string;
    newCheckOutDate: string;
    newCheckInTime: string;
    newCheckOutTime: string;
    newCityTax: number;
  }): Promise<void> {
    await db
      .update(bookings)
      .set({ 
        checkInDate: data.newCheckInDate,
        checkOutDate: data.newCheckOutDate,
        checkInTime: data.newCheckInTime,
        checkOutTime: data.newCheckOutTime,
        cityTax: data.newCityTax.toString(),
        updatedAt: new Date(),
        modificationDate: new Date()
      })
      .where(eq(bookings.id, id));
  }

  async updateBookingPaymentStatus(id: number, paymentStatus: string): Promise<void> {
    await db
      .update(bookings)
      .set({ paymentStatus: paymentStatus as any, updatedAt: new Date() })
      .where(eq(bookings.id, id));
  }

  async updateBookingPaymentInfo(id: number, data: {
    paymentReceived: boolean;
    paymentReceivedBy: string | null;
    paymentReceivedAt: string | null;
  }): Promise<void> {
    await db
      .update(bookings)
      .set({ 
        paymentReceived: data.paymentReceived,
        paymentReceivedBy: data.paymentReceivedBy,
        paymentReceivedAt: data.paymentReceivedAt ? new Date(data.paymentReceivedAt) : null,
        updatedAt: new Date()
      })
      .where(eq(bookings.id, id));
  }

  async updateBookingCityTaxInfo(id: number, data: {
    cityTaxCollected: boolean;
    cityTaxCollectedBy: string | null;
    cityTaxCollectedAt: string | null;
  }): Promise<void> {
    await db
      .update(bookings)
      .set({ 
        cityTaxCollected: data.cityTaxCollected,
        cityTaxCollectedBy: data.cityTaxCollectedBy,
        cityTaxCollectedAt: data.cityTaxCollectedAt ? new Date(data.cityTaxCollectedAt) : null,
        updatedAt: new Date()
      })
      .where(eq(bookings.id, id));
  }

  async confirmBooking(id: number): Promise<void> {
    await db
      .update(bookings)
      .set({ 
        status: "confirmed", 
        paymentStatus: "paid",
        updatedAt: new Date() 
      })
      .where(eq(bookings.id, id));
  }

  async cleanupAbandonedBookings(): Promise<void> {
    // Remove pending bookings older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    await db
      .delete(bookings)
      .where(
        and(
          eq(bookings.status, "pending"),
          sql`${bookings.createdAt} < ${thirtyMinutesAgo.toISOString()}`
        )
      );
  }

  async checkAvailability(checkIn: string, checkOut: string, excludeBookingId?: number): Promise<boolean> {
    const conditions = [
      or(
        eq(bookings.status, "confirmed" as any),
        eq(bookings.status, "checked_in" as any)
      ),
      // Check for any overlap: existing booking check-in is before new check-out AND existing check-out is after new check-in
      and(
        sql`${bookings.checkInDate} < ${checkOut}`,
        sql`${bookings.checkOutDate} > ${checkIn}`
      )
    ];

    if (excludeBookingId) {
      conditions.push(sql`${bookings.id} != ${excludeBookingId}` as any);
    }

    const result = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(...conditions));

    return result[0].count === 0;
  }

  async getBookingsByDateRange(startDate: string, endDate: string, includeBlocks = false): Promise<Booking[]> {
    // Fix: Check for any booking that overlaps with the date range
    // A booking overlaps if: check-in is before range end AND check-out is after range start
    let conditions = [
      lte(bookings.checkInDate, endDate),
      gt(bookings.checkOutDate, startDate)
    ];

    // Always exclude cancelled bookings from calendar display
    conditions.push(
      not(eq(bookings.status, "cancelled"))
    );

    if (!includeBlocks) {
      // Exclude blocked dates for regular booking lists
      conditions.push(
        or(
          eq(bookings.status, "confirmed" as any),
          eq(bookings.status, "checked_in" as any)
        ) as any
      );
      conditions.push(
        or(
          eq(bookings.bookingSource, "direct" as any),
          eq(bookings.bookingSource, "airbnb" as any), 
          eq(bookings.bookingSource, "booking.com" as any),
          eq(bookings.bookingSource, "custom" as any)
        ) as any
      );
    }
    // If includeBlocks is true, include blocks and active bookings (but exclude cancelled)

    return await db
      .select()
      .from(bookings)
      .where(and(...conditions));
  }

  async associateBookingWithUser(bookingId: number, userId: string): Promise<void> {
    await db
      .update(bookings)
      .set({ userId, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));
  }

  // Property image operations
  async getPropertyImages(): Promise<PropertyImage[]> {
    return await db
      .select()
      .from(propertyImages)
      .orderBy(propertyImages.displayOrder, propertyImages.id);
  }

  async addPropertyImage(imageData: InsertPropertyImage): Promise<PropertyImage> {
    const [image] = await db.insert(propertyImages).values(imageData).returning();
    return image;
  }

  async deletePropertyImage(id: number): Promise<void> {
    await db.delete(propertyImages).where(eq(propertyImages.id, id));
  }

  async updateImageOrder(id: number, order: number): Promise<void> {
    await db
      .update(propertyImages)
      .set({ displayOrder: order })
      .where(eq(propertyImages.id, id));
  }

  // Amenities operations
  async getAmenities(): Promise<Amenity[]> {
    return await db
      .select()
      .from(amenities)
      .where(eq(amenities.isActive, true))
      .orderBy(amenities.displayOrder, amenities.id);
  }

  async addAmenity(amenityData: InsertAmenity): Promise<Amenity> {
    const [amenity] = await db.insert(amenities).values(amenityData).returning();
    return amenity;
  }

  async deleteAmenity(id: number): Promise<void> {
    await db
      .update(amenities)
      .set({ isActive: false })
      .where(eq(amenities.id, id));
  }

  async updateAmenityOrder(id: number, order: number): Promise<void> {
    await db
      .update(amenities)
      .set({ displayOrder: order })
      .where(eq(amenities.id, id));
  }

  // Reviews operations
  async getReviews(): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.isVisible, true))
      .orderBy(desc(reviews.createdAt));
  }

  async getAllReviews(): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .orderBy(desc(reviews.createdAt));
  }

  async addReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    return review;
  }

  async addGuestReview(reviewData: any): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    return review;
  }

  async getReviewByBookingAndEmail(bookingId: number, guestEmail: string): Promise<Review | null> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.bookingId, bookingId),
        eq(reviews.guestEmail, guestEmail)
      ));
    return review || null;
  }

  async getReviewByBookingId(bookingId: number): Promise<Review | null> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.bookingId, bookingId));
    return review || null;
  }

  async approveReview(reviewId: number): Promise<Review> {
    const [review] = await db
      .update(reviews)
      .set({ 
        isApproved: true, 
        isVisible: true
      })
      .where(eq(reviews.id, reviewId))
      .returning();
    return review;
  }

  async rejectReview(reviewId: number, reason?: string): Promise<Review> {
    const [review] = await db
      .update(reviews)
      .set({ 
        isApproved: false, 
        isVisible: false
      })
      .where(eq(reviews.id, reviewId))
      .returning();
    return review;
  }

  async getPendingReviews(): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.isApproved, false))
      .orderBy(desc(reviews.createdAt));
  }

  async deleteReview(reviewId: number): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, reviewId));
  }

  async getReviewStats(): Promise<{
    averageRating: number;
    totalCount: number;
    cleanlinessAvg: number;
    locationAvg: number;
    checkinAvg: number;
    valueAvg: number;
    communicationAvg: number;
  }> {
    const result = await db
      .select({
        averageRating: sql<number>`AVG(${reviews.rating})::numeric(3,1)`,
        totalCount: count(),
        cleanlinessAvg: sql<number>`AVG(${reviews.cleanlinessRating})::numeric(3,1)`,
        locationAvg: sql<number>`AVG(${reviews.locationRating})::numeric(3,1)`,
        checkinAvg: sql<number>`AVG(${reviews.checkinRating})::numeric(3,1)`,
        valueAvg: sql<number>`AVG(${reviews.valueRating})::numeric(3,1)`,
        communicationAvg: sql<number>`AVG(${reviews.communicationRating})::numeric(3,1)`,
      })
      .from(reviews)
      .where(eq(reviews.isVisible, true));

    return result[0] || {
      averageRating: 0,
      totalCount: 0,
      cleanlinessAvg: 0,
      locationAvg: 0,
      checkinAvg: 0,
      valueAvg: 0,
      communicationAvg: 0,
    };
  }

  // Messages operations
  async getMessages(isFromAdmin?: boolean): Promise<Message[]> {
    const query = typeof isFromAdmin === 'boolean'
      ? db.select().from(messages).where(eq(messages.isFromAdmin, isFromAdmin))
      : db.select().from(messages);
    
    return await query.orderBy(desc(messages.createdAt));
  }

  async addMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async markMessageAsRead(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
  }

  async getUnreadMessagesCount(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.isRead, false));
    return result[0].count;
  }

  // About content operations
  async getAboutContent(): Promise<AboutContent[]> {
    return await db
      .select()
      .from(aboutContent)
      .where(eq(aboutContent.isActive, true))
      .orderBy(aboutContent.displayOrder);
  }

  async updateAboutContent(id: number, contentData: Partial<AboutContent>): Promise<void> {
    await db
      .update(aboutContent)
      .set({ ...contentData, updatedAt: new Date() })
      .where(eq(aboutContent.id, id));
  }

  // Analytics
  async getAnalytics(): Promise<{
    totalBookings: number;
    totalRevenue: number;
    occupancyRate: number;
    averageRating: number;
  }> {
    const [bookingStats] = await db
      .select({
        totalBookings: count(),
        totalRevenue: sql<number>`COALESCE(SUM(${bookings.totalPrice}), 0)::numeric`,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          or(
            eq(bookings.bookingSource, "direct"),
            eq(bookings.bookingSource, "airbnb"),
            eq(bookings.bookingSource, "booking.com"),
            eq(bookings.bookingSource, "custom")
          ) // Only count actual reservations, not blocked dates
        )
      );

    const [reviewStats] = await db
      .select({
        averageRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)::numeric(3,1)`,
      })
      .from(reviews)
      .where(eq(reviews.isVisible, true));

    // Calculate occupancy rate for current month
    const currentDate = new Date();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();

    const [occupiedDays] = await db
      .select({
        count: count(),
      })
      .from(bookings)
      .where(
        and(
          gte(bookings.checkInDate, firstDay.toISOString().split('T')[0]),
          lte(bookings.checkOutDate, lastDay.toISOString().split('T')[0]),
          or(
            eq(bookings.status, "confirmed"),
            eq(bookings.status, "checked_in")
          )
        )
      );

    const occupancyRate = Math.round((occupiedDays.count / daysInMonth) * 100);

    return {
      totalBookings: bookingStats.totalBookings,
      totalRevenue: Number(bookingStats.totalRevenue),
      occupancyRate,
      averageRating: Number(reviewStats.averageRating),
    };
  }

  async getUserReferralStats(userId: string): Promise<{
    totalReferrals: number;
    referredBy: string | null;
    referrerName: string | null;
    referralCode: string;
  }> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      throw new Error("User not found");
    }

    return {
      totalReferrals: user.totalReferrals || 0,
      referredBy: user.referredBy,
      referrerName: user.referrerName,
      referralCode: user.referralCode!,
    };
  }

  async getAllUsersWithDetails(): Promise<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth?: string;
    country?: string;
    mobileNumber?: string;
    referralCode: string;
    totalReferrals: number;
    referredBy?: string;
    referrerName?: string;
    credits: number;
    provider: string;
    totalBookings: number;
    totalSpent: number;
    isRegistered: boolean;
  }>> {
    // Get all registered users
    const allUsers = await db.select().from(users);

    // Get all bookings to find unregistered users
    const allBookings = await db
      .select({
        guestFirstName: bookings.guestFirstName,
        guestLastName: bookings.guestLastName,
        guestEmail: bookings.guestEmail,
        guestCountry: bookings.guestCountry,
        guestPhone: bookings.guestPhone,
        totalPrice: bookings.totalPrice,
        status: bookings.status,
        userId: bookings.userId,
      })
      .from(bookings)
      .where(eq(bookings.status, 'confirmed'));

    // Create a map of all unique users (both registered and unregistered)
    const userMap = new Map();

    // Add registered users
    for (const user of allUsers) {
      // Calculate booking statistics for this user
      const userBookings = await db
        .select({
          count: count(),
          totalSpent: sql<number>`COALESCE(SUM(${bookings.totalPrice}), 0)`,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.status, 'confirmed'),
            or(
              eq(bookings.userId, user.id),
              eq(bookings.guestEmail, user.email)
            )
          )
        );

      const bookingStats = userBookings[0] || { count: 0, totalSpent: 0 };

      userMap.set(user.email, {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: user.dateOfBirth || undefined,
        country: user.country || undefined,
        mobileNumber: user.mobileNumber || undefined,
        referralCode: user.referralCode || '',
        totalReferrals: user.totalReferrals || 0,
        referredBy: user.referredBy || undefined,
        referrerName: user.referrerName || undefined,
        credits: user.accountCredits ? Number(user.accountCredits) : 0,
        provider: user.authProvider || 'local',
        totalBookings: bookingStats.count,
        totalSpent: Number(bookingStats.totalSpent) || 0,
        isRegistered: true,
      });
    }

    // Add unregistered users from bookings
    const unregisteredBookings = new Map();
    for (const booking of allBookings) {
      if (!userMap.has(booking.guestEmail)) {
        if (!unregisteredBookings.has(booking.guestEmail)) {
          unregisteredBookings.set(booking.guestEmail, {
            firstName: booking.guestFirstName,
            lastName: booking.guestLastName,
            email: booking.guestEmail,
            country: booking.guestCountry,
            phone: booking.guestPhone,
            totalBookings: 0,
            totalSpent: 0,
          });
        }
        const userData = unregisteredBookings.get(booking.guestEmail);
        userData.totalBookings += 1;
        userData.totalSpent += Number(booking.totalPrice);
      }
    }

    // Add unregistered users to the map
    for (const [email, userData] of Array.from(unregisteredBookings.entries())) {
      userMap.set(email, {
        id: `unregistered_${email}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        dateOfBirth: undefined,
        country: userData.country || undefined,
        mobileNumber: userData.phone || undefined,
        referralCode: '',
        totalReferrals: 0,
        referredBy: undefined,
        referrerName: undefined,
        credits: 0,
        provider: 'unregistered',
        totalBookings: userData.totalBookings,
        totalSpent: userData.totalSpent,
        isRegistered: false,
      });
    }

    return Array.from(userMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }

  // Promotions operations
  async getPromotions(): Promise<Promotion[]> {
    const promotionsList = await db.select().from(promotions).orderBy(desc(promotions.createdAt));
    
    // Add booking statistics for each promotion
    const promotionsWithStats = await Promise.all(
      promotionsList.map(async (promotion) => {
        const stats = await this.getPromotionBookingStats(promotion.id, promotion.startDate, promotion.endDate);
        return {
          ...promotion,
          bookingCount: stats.bookingCount,
          totalNights: stats.totalNights,
          totalSavings: stats.totalSavings
        };
      })
    );
    
    return promotionsWithStats;
  }
  
  async getPromotionBookingStats(promotionId: number, startDate: Date, endDate: Date) {
    // TODO: Implement proper promotion tracking in bookings table
    // For now, return zeros since we don't have proper tracking of which bookings used specific promotions
    // Previously this was incorrectly counting ALL bookings during promotion period
    return {
      bookingCount: 0,
      totalNights: 0,
      totalSavings: '0.00'
    };
  }

  async getActivePromotions(): Promise<Promotion[]> {
    const now = new Date();
    return await db.select().from(promotions).where(
      and(
        eq(promotions.isActive, true),
        lte(promotions.startDate, now),
        gte(promotions.endDate, now)
      )
    ).orderBy(desc(promotions.createdAt));
  }

  async addPromotion(promotionData: InsertPromotion): Promise<Promotion> {
    // Only check for active promotions if the new promotion is set to be active
    if (promotionData.isActive) {
      const activePromotions = await this.getActivePromotions();
      if (activePromotions.length > 0) {
        throw new Error("Cannot add new promotion while another promotion is active. Please deactivate the current promotion first.");
      }
    }
    
    const [promotion] = await db
      .insert(promotions)
      .values(promotionData)
      .returning();
    return promotion;
  }

  async updatePromotionStatus(id: number, isActive: boolean): Promise<void> {
    if (isActive) {
      // Check if there's already an active promotion different from this one
      const activePromotions = await this.getActivePromotions();
      const conflictingPromotion = activePromotions.find(p => p.id !== id);
      
      if (conflictingPromotion) {
        throw new Error(`Cannot activate promotion. Another promotion "${conflictingPromotion.name}" is already active. Please deactivate it first.`);
      }
    }
    
    // Update the target promotion
    await db
      .update(promotions)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(promotions.id, id));
  }

  async deletePromotion(id: number): Promise<void> {
    await db.delete(promotions).where(eq(promotions.id, id));
  }

  // Hero images operations
  async getHeroImages(): Promise<HeroImage[]> {
    return await db.select().from(heroImages).orderBy(heroImages.displayOrder, heroImages.position);
  }

  async getActiveHeroImages(): Promise<HeroImage[]> {
    return await db.select().from(heroImages)
      .where(eq(heroImages.isActive, true))
      .orderBy(heroImages.displayOrder, heroImages.position);
  }

  async addHeroImage(imageData: InsertHeroImage): Promise<HeroImage> {
    const [image] = await db
      .insert(heroImages)
      .values(imageData)
      .returning();
    return image;
  }

  async updateHeroImage(id: number, data: Partial<HeroImage>): Promise<void> {
    await db
      .update(heroImages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(heroImages.id, id));
  }

  async deleteHeroImage(id: number): Promise<void> {
    await db.delete(heroImages).where(eq(heroImages.id, id));
  }

  async updateHeroImageOrder(id: number, displayOrder: number): Promise<void> {
    await db
      .update(heroImages)
      .set({ displayOrder, updatedAt: new Date() })
      .where(eq(heroImages.id, id));
  }

  // Activity timeline operations
  async getActivityTimeline(): Promise<ActivityTimeline[]> {
    const timeline = await db
      .select()
      .from(activityTimeline)
      .orderBy(desc(activityTimeline.createdAt));
    return timeline;
  }

  async addActivityTimeline(timelineData: InsertActivityTimeline): Promise<ActivityTimeline> {
    const [timeline] = await db
      .insert(activityTimeline)
      .values(timelineData)
      .returning();
    return timeline;
  }

  // Promo codes operations
  async getPromoCodes(): Promise<PromoCode[]> {
    const codes = await db
      .select()
      .from(promoCodes)
      .orderBy(desc(promoCodes.createdAt));
    return codes;
  }

  async createPromoCode(promoCodeData: InsertPromoCode): Promise<PromoCode> {
    const [promoCode] = await db
      .insert(promoCodes)
      .values({
        ...promoCodeData,
        discountValue: promoCodeData.discountValue.toString(),
        minOrderAmount: promoCodeData.minOrderAmount ? promoCodeData.minOrderAmount.toString() : "0.00",
        maxDiscountAmount: promoCodeData.maxDiscountAmount ? promoCodeData.maxDiscountAmount.toString() : null
      })
      .returning();
    return promoCode;
  }

  async deletePromoCode(id: number): Promise<void> {
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
  }

  async validatePromoCode(code: string): Promise<PromoCode | null> {
    const now = new Date();
    
    const [promoCode] = await db
      .select()
      .from(promoCodes)
      .where(
        and(
          eq(promoCodes.code, code),
          eq(promoCodes.isActive, true),
          lte(promoCodes.startDate, now),
          gte(promoCodes.endDate, now)
        )
      );

    if (!promoCode) {
      return null;
    }

    // Check usage limit
    if (promoCode.usageLimit !== null && (promoCode.usageCount || 0) >= promoCode.usageLimit) {
      return null;
    }

    return promoCode;
  }

  async recordPromoCodeUsage(usage: InsertPromoCodeUsage): Promise<PromoCodeUsage> {
    // Record the usage
    const [recordedUsage] = await db
      .insert(promoCodeUsage)
      .values(usage)
      .returning();

    // Increment the usage count
    await db
      .update(promoCodes)
      .set({ 
        usageCount: sql`${promoCodes.usageCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(promoCodes.id, usage.promoCodeId));

    return recordedUsage;
  }

  async getPromoCodeUsage(promoCodeId: number): Promise<PromoCodeUsage[]> {
    return await db
      .select()
      .from(promoCodeUsage)
      .where(eq(promoCodeUsage.promoCodeId, promoCodeId))
      .orderBy(desc(promoCodeUsage.usedAt));
  }

  async getPromoCodeWithUsage(promoCodeId: number): Promise<{ promoCode: PromoCode; usage: PromoCodeUsage[] } | null> {
    const [promoCode] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.id, promoCodeId));

    if (!promoCode) {
      return null;
    }

    const usage = await this.getPromoCodeUsage(promoCodeId);
    
    return { promoCode, usage };
  }

  async validateVoucher(code: string, bookingAmount: number): Promise<any | null> {
    const now = new Date();


    const [voucher] = await db
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.code, code),
          eq(vouchers.isActive, true),
          lte(vouchers.validFrom, now),
          gte(vouchers.validUntil, now)
        )
      );

    if (!voucher) {

      return null;
    }

    // Check usage limit
    if (voucher.usageCount >= voucher.usageLimit) {

      return null;
    }

    // Check minimum booking amount
    const minAmount = parseFloat(voucher.minBookingAmount || "0");


    if (bookingAmount < minAmount) {

      return null;
    }

    return voucher;
  }

  // Pricing settings operations
  async getPricingSettings(): Promise<PricingSettings | undefined> {
    const [settings] = await db
      .select()
      .from(pricingSettings)
      .limit(1);
    
    // If no settings exist, create default ones
    if (!settings) {
      const defaultSettings = {
        basePrice: "150.00",
        cleaningFee: "25.00",
        petFee: "35.00",
        discountWeekly: 10,
        discountMonthly: 20,
      };
      const [created] = await db
        .insert(pricingSettings)
        .values(defaultSettings)
        .returning();
      return created;
    }
    
    return settings;
  }

  async updatePricingSettings(settingsData: InsertPricingSettings): Promise<PricingSettings> {
    // First, try to get existing settings
    const existing = await this.getPricingSettings();
    
    if (existing) {
      // Update existing settings
      const [updated] = await db
        .update(pricingSettings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(pricingSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new settings if none exist
      const [created] = await db
        .insert(pricingSettings)
        .values(settingsData)
        .returning();
      return created;
    }
  }

  // Get voucher usage data for a specific booking
  async getVoucherUsageByBookingId(bookingId: number): Promise<any | null> {
    const [usage] = await db
      .select({
        id: voucherUsage.id,
        voucherId: voucherUsage.voucherId,
        bookingId: voucherUsage.bookingId,
        voucherCode: vouchers.code,
        discountAmount: voucherUsage.discountAmount,
        bookingAmount: voucherUsage.bookingAmount,
        usedAt: voucherUsage.usedAt,
        guestEmail: voucherUsage.guestEmail,
        guestName: voucherUsage.guestName,
        checkInDate: voucherUsage.checkInDate,
        checkOutDate: voucherUsage.checkOutDate,
      })
      .from(voucherUsage)
      .innerJoin(vouchers, eq(voucherUsage.voucherId, vouchers.id))
      .where(eq(voucherUsage.bookingId, bookingId))
      .limit(1);

    return usage || null;
  }

  // PMS operations implementation
  async getPMSIntegrations(): Promise<PMSIntegration[]> {
    try {
      // Temporarily return empty array instead of querying database
      // const integrations = await db.select().from(pmsIntegrations).orderBy(desc(pmsIntegrations.createdAt));
      return [];
    } catch (error) {
      console.error('PMS Integrations error:', error);
      return [];
    }
  }

  async createPMSIntegration(integration: Omit<InsertPMSIntegration, 'id' | 'createdAt' | 'updatedAt'>): Promise<PMSIntegration> {

    try {
      const now = new Date();
      const integrationData = {
        ...integration,
        lastSync: now,
        createdAt: now,
        updatedAt: now
      };

      const [created] = await db
        .insert(pmsIntegrations)
        .values(integrationData)
        .returning();

      return created;
    } catch (error) {

      throw error;
    }
  }

  async getPMSIntegration(id: string): Promise<PMSIntegration | undefined> {
    const [integration] = await db.select().from(pmsIntegrations).where(eq(pmsIntegrations.id, id));
    return integration;
  }

  async deletePMSIntegration(id: string): Promise<void> {
    try {
      console.log(`🗑️  Attempting to delete PMS integration with ID: ${id}`);
      
      // Temporarily only delete the integration - skip related data for diagnosis
      console.log(`🔌 Attempting to delete integration only: ${id}`);
      const deletedIntegration = await db.delete(pmsIntegrations).where(eq(pmsIntegrations.id, id)).returning();
      console.log(`🔌 Deleted integration:`, deletedIntegration);
      
      if (deletedIntegration.length === 0) {
        throw new Error(`Integration with ID ${id} was not found or could not be deleted`);
      }
      
      console.log(`✅ Integration deleted successfully`);
    } catch (error) {
      console.error(`❌ Error deleting PMS integration ${id}:`, error);
      console.error(`❌ Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  async updatePMSIntegrationSync(id: string): Promise<void> {
    await db
      .update(pmsIntegrations)
      .set({ lastSync: new Date(), updatedAt: new Date() })
      .where(eq(pmsIntegrations.id, id));
  }

  async updatePMSIntegrationStatus(id: string, status: string): Promise<void> {
    await db
      .update(pmsIntegrations)
      .set({ status, updatedAt: new Date() })
      .where(eq(pmsIntegrations.id, id));
  }

  async updatePMSIntegrationBookingCount(id: string, count: number): Promise<void> {
    await db
      .update(pmsIntegrations)
      .set({ bookingsCount: count, updatedAt: new Date() })
      .where(eq(pmsIntegrations.id, id));
  }

  async getPMSBookings(): Promise<PMSBooking[]> {
    try {
      // Temporarily return empty array instead of querying database
      // const bookings = await db.select().from(pmsBookings).orderBy(desc(pmsBookings.start));
      return [];
    } catch (error) {
      console.error('PMS Bookings error:', error);
      return [];
    }
  }

  async createPMSBooking(booking: Omit<InsertPMSBooking, 'id' | 'createdAt' | 'updatedAt'>): Promise<PMSBooking> {

    try {
      const [created] = await db
        .insert(pmsBookings)
        .values(booking)
        .returning();

      return created;
    } catch (error) {

      throw error;
    }
  }

  async getPMSReviews(): Promise<PMSReview[]> {
    try {
      // Temporarily return empty array instead of querying database
      // const reviews = await db.select().from(pmsReviews).orderBy(desc(pmsReviews.date));
      return [];
    } catch (error) {
      console.error('PMS Reviews error:', error);
      return [];
    }
  }

  async createPMSReview(review: Omit<InsertPMSReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<PMSReview> {
    const [created] = await db
      .insert(pmsReviews)
      .values(review)
      .returning();
    return created;
  }

  async getPMSMessages(): Promise<PMSMessage[]> {
    try {
      // Temporarily return empty array instead of querying database
      // const messages = await db.select().from(pmsMessages).orderBy(desc(pmsMessages.timestamp));
      return [];
    } catch (error) {
      console.error('PMS Messages error:', error);
      return [];
    }
  }

  async createPMSMessage(message: Omit<InsertPMSMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<PMSMessage> {
    const [created] = await db
      .insert(pmsMessages)
      .values(message)
      .returning();
    return created;
  }

  async markPMSMessageAsRead(id: string): Promise<void> {
    await db
      .update(pmsMessages)
      .set({ read: true, updatedAt: new Date() })
      .where(eq(pmsMessages.id, id));
  }
  
  // Team Management implementation
  async getAllRoles(): Promise<any[]> {
    // Return mock roles data for now since the table may not exist yet
    return [
      {
        id: '1',
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system access',
        permissions: ['bookings:view', 'bookings:create', 'users:view', 'analytics:view'],
        color: '#3b82f6',
        priority: 100,
        isActive: true
      },
      {
        id: '2', 
        name: 'manager',
        displayName: 'Manager',
        description: 'Property and booking management',
        permissions: ['bookings:view', 'bookings:create', 'properties:view'],
        color: '#059669',
        priority: 50,
        isActive: true
      }
    ];
  }
  
async getAllTeamMembers(): Promise<any[]> {
    // Get all users with admin or team_member roles
    const allTeamUsers = await db
      .select()
      .from(users)
      .where(or(
        eq(users.role, 'admin'),
        eq(users.role, 'team_member')
      ));
    
    // Get team member data if it exists
    const teamMemberData = await db.select().from(teamMembers);
    const teamMemberMap = new Map(teamMemberData.map(tm => [tm.userId, tm]));
    
    // Get all roles for mapping
    const roles = await this.getAllRoles();
    const roleMap = new Map(roles.map(role => [role.id, role]));
    
    // Map the data to include proper role objects and default values for missing fields
    const mappedMembers = allTeamUsers.map((user, index) => {
      const teamMemberInfo = teamMemberMap.get(user.id);
      
      // Map user role to team role
      let teamRole;
      if (user.role === 'admin') {
        teamRole = roleMap.get('1') || {
          id: '1',
          name: 'admin',
          displayName: 'Administrator',
          color: '#3b82f6',
          permissions: ['bookings:view', 'bookings:create', 'users:view', 'analytics:view']
        };
      } else {
        teamRole = roleMap.get('2') || {
          id: '2',
          name: 'manager',
          displayName: 'Manager',
          color: '#059669',
          permissions: ['bookings:view', 'bookings:create', 'properties:view']
        };
      }
      
      return {
        id: teamMemberInfo?.id?.toString() || user.id,
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: teamRole,
        customPermissions: teamMemberInfo?.customPermissions || [],
        restrictions: teamMemberInfo?.restrictions || [],
        allowedFeatures: teamMemberInfo?.allowedFeatures || [],
        allowedProperties: teamMemberInfo?.allowedProperties || [],
        accessLevel: teamMemberInfo?.accessLevel || (user.role === 'admin' ? 'full' : 'limited'),
        isActive: teamMemberInfo?.isActive ?? user.isActive,
        lastAccessAt: teamMemberInfo?.lastAccessAt || user.lastLoginAt,
        expiresAt: teamMemberInfo?.expiresAt || null,
        createdAt: teamMemberInfo?.createdAt || user.createdAt,
        riskScore: teamMemberInfo?.riskScore || (user.role === 'admin' ? 10 : 25),
        deviceInfo: teamMemberInfo?.deviceInfo || {},
        location: teamMemberInfo?.location || {},
        // Add default values for enhanced properties expected by the frontend
        loginHistory: [],
        securityEvents: [],
        performanceMetrics: {
          tasksCompleted: Math.floor(Math.random() * 100),
          averageResponseTime: Math.floor(Math.random() * 1000) + 200,
          errorRate: Math.floor(Math.random() * 5),
          uptime: 99.9
        },
        biometricData: {
          fingerprintEnabled: false,
          faceIdEnabled: false
        },
        aiInsights: {
          productivity: 75 + Math.floor(Math.random() * 20),
          riskPrediction: teamMemberInfo?.riskScore || (user.role === 'admin' ? 10 : 25),
          recommendations: [],
          anomalies: []
        }
      };
    });
    
    return mappedMembers;
  }
  
async createTeamMember(data: any): Promise<any> {
    // Check if user with this email already exists
    const existingUser = await this.getUserByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Find the role to get full role information
    const roles = await this.getAllRoles();
    const role = roles.find(r => r.id === data.roleId);

    if (!role) {
      throw new Error('Role not found');
    }

    const userId = Date.now().toString();
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user record in database
    const [createdUser] = await db
      .insert(users)
      .values({
        id: userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
        role: 'team_member', // Team members get team_member role
        authProvider: 'local',
        isActive: true,
        createdBy: 'admin',
        referralCode: `TEAM${userId.slice(-6)}` // Generate referral code
      })
      .returning();

    // Create team member record in the database
    const [newMember] = await db
      .insert(teamMembers)
      .values({
        userId: userId,
        roleId: role.id,
        customPermissions: data.customPermissions || [],
        restrictions: data.restrictions || [],
        allowedFeatures: data.allowedFeatures || [],
        allowedProperties: data.allowedProperties || [],
        accessLevel: data.accessLevel || 'limited',
        isActive: true,
        lastAccessAt: null,
        expiresAt: data.expiresAt || null,
        createdBy: 'admin',
        riskScore: 25, // Default risk score
        deviceInfo: {},
        location: {}
      })
      .returning();

    return newMember;
  }

  async getTeamMemberByUserId(userId: string): Promise<any | null> {
    // Find the team member by userId from database
    const [teamMember] = await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
    return teamMember || null;
  }

  async updateTeamMember(id: string, updateData: any): Promise<any> {
    try {
      // Find the team member first
      const existingMembers = await this.getAllTeamMembers();
      const existingMember = existingMembers.find(m => m.id === id);
      
      if (!existingMember) {
        throw new Error('Team member not found');
      }

      // Update the user record
      const updateUser: any = {};
      if (updateData.firstName !== undefined) updateUser.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) updateUser.lastName = updateData.lastName;
      if (updateData.email !== undefined) updateUser.email = updateData.email;
      if (updateData.isActive !== undefined) updateUser.isActive = updateData.isActive;
      if (updateData.roleId !== undefined) {
        // Map roleId to user role
        const roleMap: { [key: string]: string } = {
          '1': 'admin',
          '2': 'team_member'
        };
        updateUser.role = roleMap[updateData.roleId] || 'team_member';
      }

      if (Object.keys(updateUser).length > 0) {
        updateUser.updatedAt = new Date();
        await db
          .update(users)
          .set(updateUser)
          .where(eq(users.id, existingMember.userId));
      }

      // Update or create team member specific data
      const teamMemberData: any = {};
      if (updateData.roleId !== undefined) teamMemberData.roleId = updateData.roleId;
      if (updateData.accessLevel !== undefined) {
        // Validate access level
        const validAccessLevels = ['full', 'limited', 'read_only', 'custom'];
        const accessLevel = updateData.accessLevel === 'read-only' ? 'read_only' : updateData.accessLevel;
        if (validAccessLevels.includes(accessLevel)) {
          teamMemberData.accessLevel = accessLevel;
        }
      }
      if (updateData.customPermissions !== undefined) teamMemberData.customPermissions = updateData.customPermissions;
      if (updateData.expiresAt !== undefined) teamMemberData.expiresAt = updateData.expiresAt;

      // Check if team member record exists
      const [existingTeamMember] = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.userId, existingMember.userId));

      if (existingTeamMember && Object.keys(teamMemberData).length > 0) {
        // Update existing team member record
        await db
          .update(teamMembers)
          .set(teamMemberData)
          .where(eq(teamMembers.userId, existingMember.userId));
      } else if (Object.keys(teamMemberData).length > 0) {
        // Create new team member record
        await db
          .insert(teamMembers)
          .values({
            userId: existingMember.userId,
            ...teamMemberData
          });
      }

      // Return the updated member
      const updatedMembers = await this.getAllTeamMembers();
      const updatedMember = updatedMembers.find(m => m.id === id);
      
      return updatedMember;
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  }

  async updateTeamMemberStatus(id: string, isActive: boolean): Promise<void> {
    // Update in users table
    await db
      .update(users)
      .set({ isActive: isActive, updatedAt: new Date() })
      .where(eq(users.id, id));
    
    // Update in team members table if entry exists
    try {
      await db
        .update(teamMembers)
        .set({ isActive: isActive, updatedAt: new Date() })
        .where(eq(teamMembers.userId, id));
    } catch (error) {
      // Ignore if no team member entry exists
      console.log('No team member entry to update for user:', id);
    }
  }

  async deleteTeamMember(id: string): Promise<void> {
    console.log(`🗑️  Attempting to delete team member with ID: ${id}`);
    
    // First check if user exists and has admin or team_member role
    const [user] = await db.select().from(users).where(
      and(
        eq(users.id, id),
        or(
          eq(users.role, 'admin'),
          eq(users.role, 'team_member')
        )
      )
    );
    
    if (!user) {
      console.log(`❌ User with ID ${id} not found or not a team member`);
      throw new Error('Team member not found');
    }
    
    console.log(`👤 Found user: ${user.firstName} ${user.lastName} (${user.email}) with role: ${user.role}`);
    
    try {
      // Delete from team members table first (if entry exists)
      console.log(`🔄 Deleting from team_members table...`);
      const deletedFromTeamMembers = await db.delete(teamMembers).where(eq(teamMembers.userId, id)).returning();
      console.log(`✅ Deleted ${deletedFromTeamMembers.length} records from team_members table`);
      
      // Delete from users table
      console.log(`🔄 Deleting from users table...`);
      const deletedFromUsers = await db.delete(users).where(eq(users.id, id)).returning();
      console.log(`✅ Deleted ${deletedFromUsers.length} records from users table`);
      
      if (deletedFromUsers.length === 0) {
        throw new Error('Failed to delete user from users table');
      }
      
      console.log(`✅ Successfully deleted team member: ${user.firstName} ${user.lastName}`);
    } catch (error) {
      console.error(`❌ Error deleting team member ${id}:`, error);
      throw error;
    }
  }

  async resetTeamMemberPassword(id: string): Promise<string> {
    // Check if user exists and has admin or team_member role
    const [user] = await db.select().from(users).where(
      and(
        eq(users.id, id),
        or(
          eq(users.role, 'admin'),
          eq(users.role, 'team_member')
        )
      )
    );
    
    if (!user) {
      throw new Error('Team member not found');
    }
    
    // Generate new password
    const newPassword = `temp${Date.now().toString().slice(-6)}`;
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password in users table
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
    
    return newPassword;
  }

  async updateTeamMemberAccessLevel(id: string, accessLevel: string): Promise<void> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.userId, id));
    if (!member) {
      throw new Error('Member not found');
    }
    
    // Update in database
    await db
      .update(teamMembers)
      .set({ accessLevel: accessLevel, updatedAt: new Date() })
      .where(eq(teamMembers.userId, id));
  }
}

export const storage = new DatabaseStorage();
