import {
  users,
  bookings,
  propertyImages,
  amenities,
  reviews,
  messages,
  aboutContent,
  promotions,
  heroImages,
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
  type InsertHeroImage,
  type HeroImage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createLocalUser(userData: { firstName: string; lastName: string; email: string; password: string; referralCode?: string }): Promise<User>;
  createAdminUser(userData: { firstName: string; lastName: string; email: string; password: string }): Promise<User>;
  incrementReferralCount(userId: string): Promise<void>;
  updateUserProfile(userId: string, data: Partial<User>): Promise<User>;
  
  // Booking operations with comprehensive pricing
  createBooking(bookingData: {
    guestFirstName: string;
    guestLastName: string;
    guestEmail: string;
    guestCountry: string;
    guestPhone: string;
    checkInDate: string;
    checkOutDate: string;
    guests: number;
    paymentMethod: "online" | "property";
    hasPet?: boolean;
    referralCode?: string;
    createdBy?: "admin" | "guest";
    bookedForSelf?: boolean;
    userId?: string;
  }): Promise<Booking>;
  getBookings(filters?: { status?: string; userId?: string }): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByConfirmationCode(code: string): Promise<Booking | undefined>;
  updateBookingStatus(id: number, status: string): Promise<void>;
  checkAvailability(checkIn: string, checkOut: string, excludeBookingId?: number): Promise<boolean>;
  getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]>;
  calculateBookingPricing(checkIn: string, checkOut: string, guests: number, hasPet: boolean, referralCode?: string): Promise<{
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
    totalPrice: number;
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
  addReview(review: InsertReview): Promise<Review>;
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

  // Hero images operations
  getHeroImages(): Promise<HeroImage[]>;
  getActiveHeroImages(): Promise<HeroImage[]>;
  addHeroImage(image: InsertHeroImage): Promise<HeroImage>;
  updateHeroImage(id: number, data: Partial<HeroImage>): Promise<void>;
  deleteHeroImage(id: number): Promise<void>;
  updateHeroImageOrder(id: number, displayOrder: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, referralCode));
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

  // Booking operations
  async createBooking(bookingData: {
    guestFirstName: string;
    guestLastName: string;
    guestEmail: string;
    guestCountry: string;
    guestPhone: string;
    checkInDate: string;
    checkOutDate: string;
    guests: number;
    paymentMethod: "online" | "property";
    hasPet?: boolean;
    referralCode?: string;
    createdBy?: "admin" | "guest";
    bookedForSelf?: boolean;
    userId?: string;
  }): Promise<Booking> {
    // Calculate comprehensive pricing
    const pricing = await this.calculateBookingPricing(
      bookingData.checkInDate,
      bookingData.checkOutDate,
      bookingData.guests,
      bookingData.hasPet || false,
      bookingData.referralCode
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
        totalDiscountAmount: (pricing.lengthOfStayDiscount + pricing.referralCredit).toString(),
        
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
        
        // Status
        status: "pending",
        paymentStatus: "pending",
      })
      .returning();
    
    return booking;
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
    referralCode?: string
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
    totalPrice: number;
  }> {
    const basePrice = 110.50; // €110.50 per night
    const cleaningFee = 25.00;
    const serviceFee = 15.00;
    
    // Calculate nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const totalNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
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
    const priceAfterDiscount = priceBeforeDiscount - lengthOfStayDiscount;
    
    // Pet fee calculation
    const petFee = hasPet ? (totalNights === 1 ? 25.00 : 35.00) : 0;
    
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
    
    // Final total calculation
    const totalPrice = priceAfterDiscount + cleaningFee + serviceFee + petFee + cityTax - referralCredit;
    
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
      totalPrice: Math.max(0, totalPrice) // Ensure non-negative
    };
  }

  private generateConfirmationCode(): string {
    // Generate 8-character alphanumeric confirmation code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
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
    
    if (filters?.status) {
      conditions.push(eq(bookings.status, filters.status as any));
    }
    
    if (filters?.userId) {
      conditions.push(eq(bookings.userId, filters.userId));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(bookings).where(and(...conditions))
      : db.select().from(bookings);
    
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

  async checkAvailability(checkIn: string, checkOut: string, excludeBookingId?: number): Promise<boolean> {
    const conditions = [
      or(
        eq(bookings.status, "confirmed" as any),
        eq(bookings.status, "checked_in" as any)
      ),
      or(
        and(
          gte(bookings.checkInDate, checkIn),
          lte(bookings.checkInDate, checkOut)
        ),
        and(
          gte(bookings.checkOutDate, checkIn),
          lte(bookings.checkOutDate, checkOut)
        ),
        and(
          lte(bookings.checkInDate, checkIn),
          gte(bookings.checkOutDate, checkOut)
        )
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

  async getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.checkInDate, startDate),
          lte(bookings.checkOutDate, endDate),
          or(
            eq(bookings.status, "confirmed"),
            eq(bookings.status, "checked_in")
          )
        )
      );
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

  async addReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    return review;
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
      .where(eq(bookings.status, "confirmed"));

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

  // Promotions operations
  async getPromotions(): Promise<Promotion[]> {
    return await db.select().from(promotions).orderBy(desc(promotions.createdAt));
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
    const [promotion] = await db
      .insert(promotions)
      .values(promotionData)
      .returning();
    return promotion;
  }

  async updatePromotionStatus(id: number, isActive: boolean): Promise<void> {
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
}

export const storage = new DatabaseStorage();
