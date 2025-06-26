import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  date,
  time,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (supports both Replit Auth and local signup)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"), // For local signup, null for Replit Auth users
  dateOfBirth: date("date_of_birth"),
  country: varchar("country"),
  mobileNumber: varchar("mobile_number"),
  referralCode: varchar("referral_code").unique(),
  referredBy: varchar("referred_by"), // referral code of who referred this user
  referrerName: varchar("referrer_name"), // full name of who referred this user
  totalReferrals: integer("total_referrals").default(0), // count of users this person has referred
  authProvider: varchar("auth_provider", { enum: ["replit", "local"] }).default("local"),
  role: varchar("role", { enum: ["guest", "admin"] }).default("guest"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bookings table with enhanced payment options
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  guestFirstName: varchar("guest_first_name", { length: 100 }).notNull(),
  guestLastName: varchar("guest_last_name", { length: 100 }).notNull(),
  guestCountry: varchar("guest_country", { length: 100 }),
  guestMobile: varchar("guest_mobile", { length: 20 }),
  guestEmail: varchar("guest_email", { length: 255 }),
  
  checkInDate: date("check_in_date").notNull(),
  checkOutDate: date("check_out_date").notNull(),
  checkInTime: time("check_in_time").default("15:00"),
  checkOutTime: time("check_out_time").default("10:00"),
  
  confirmationNumber: varchar("confirmation_number", { length: 20 }).unique().notNull(),
  
  paymentMethod: varchar("payment_method", { 
    enum: ["online", "at_property_card_auth", "admin_manual_card", "admin_pay_at_property", "admin_city_tax_only"]
  }).notNull(),
  paymentStatus: varchar("payment_status", {
    enum: ["pending", "paid", "authorized", "not_required"]
  }).default("pending"),
  
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  cityTax: decimal("city_tax", { precision: 10, scale: 2 }).default("0.00"),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0.00"),
  
  status: varchar("status", {
    enum: ["confirmed", "checked_in", "checked_out", "cancelled"]
  }).default("confirmed"),
  
  userId: varchar("user_id").references(() => users.id),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property images
export const propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  url: varchar("url", { length: 500 }).notNull(),
  alt: varchar("alt", { length: 255 }),
  isPrimary: boolean("is_primary").default(false),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Amenities
export const amenities = pgTable("amenities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id),
  userId: varchar("user_id").references(() => users.id),
  guestName: varchar("guest_name", { length: 100 }).notNull(),
  rating: integer("rating").notNull(),
  content: text("content").notNull(),
  cleanlinessRating: integer("cleanliness_rating"),
  locationRating: integer("location_rating"),
  checkinRating: integer("checkin_rating"),
  valueRating: integer("value_rating"),
  communicationRating: integer("communication_rating"),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  bookingId: integer("booking_id").references(() => bookings.id),
  senderName: varchar("sender_name", { length: 100 }).notNull(),
  senderEmail: varchar("sender_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  isFromAdmin: boolean("is_from_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// About content
export const aboutContent = pgTable("about_content", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  reviews: many(reviews),
  messages: many(messages),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  reviews: many(reviews),
  messages: many(messages),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [messages.bookingId],
    references: [bookings.id],
  }),
}));

// Insert schemas
export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  confirmationNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropertyImageSchema = createInsertSchema(propertyImages).omit({
  id: true,
  createdAt: true,
});

export const insertAmenitySchema = createInsertSchema(amenities).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertAboutContentSchema = createInsertSchema(aboutContent).omit({
  id: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users);

// Local signup schema
export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
  confirmPassword: z.string(),
  referralCode: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

// User profile update schema
export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name too long").optional(),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long").optional(),
  email: z.string().email("Invalid email address").optional(),
  dateOfBirth: z.string().optional(),
  country: z.string().optional(),
  mobileNumber: z.string().optional()
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertPropertyImage = z.infer<typeof insertPropertyImageSchema>;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type InsertAmenity = z.infer<typeof insertAmenitySchema>;
export type Amenity = typeof amenities.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertAboutContent = z.infer<typeof insertAboutContentSchema>;
export type AboutContent = typeof aboutContent.$inferSelect;
