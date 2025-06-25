import {
  users,
  bookings,
  propertyImages,
  amenities,
  reviews,
  messages,
  aboutContent,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookings(filters?: { status?: string; userId?: string }): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  updateBookingStatus(id: number, status: string): Promise<void>;
  checkAvailability(checkIn: string, checkOut: string, excludeBookingId?: number): Promise<boolean>;
  getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  // Booking operations
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    // Generate confirmation number
    const confirmationNumber = `BK${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
    
    const [booking] = await db
      .insert(bookings)
      .values({
        ...bookingData,
        confirmationNumber,
      })
      .returning();
    return booking;
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
}

export const storage = new DatabaseStorage();
