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

// Logout tracking table for session invalidation
export const loggedOutSessions = pgTable("logged_out_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  loggedOutAt: timestamp("logged_out_at").defaultNow(),
});

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
  accountCredits: decimal("account_credits", { precision: 10, scale: 2 }).default("0.00"), // user account credits
  authProvider: varchar("auth_provider", { enum: ["replit", "local", "google"] }).default("local"),
  providerId: varchar("provider_id"), // Google ID, Replit ID, etc.
  role: varchar("role", { enum: ["guest", "admin", "team_member"] }).default("guest"),
  totpSecret: varchar("totp_secret"), // For 2FA Google Authenticator
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdBy: varchar("created_by"), // Admin who created this team member
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comprehensive bookings table matching frontend functionality
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  
  // Booking dates
  checkInDate: date("check_in_date").notNull(),
  checkOutDate: date("check_out_date").notNull(),
  checkInTime: time("check_in_time").default("15:00"),
  checkOutTime: time("check_out_time").default("10:00"),
  guests: integer("guests").notNull().default(1),
  
  // Guest information
  guestFirstName: varchar("guest_first_name", { length: 100 }).notNull(),
  guestLastName: varchar("guest_last_name", { length: 100 }).notNull(),
  guestEmail: varchar("guest_email", { length: 255 }).notNull(),
  guestCountry: varchar("guest_country", { length: 100 }).notNull(),
  guestPhone: varchar("guest_phone", { length: 20 }).notNull(),
  
  // Pricing breakdown - detailed breakdown matching frontend
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // €110.50 per night
  totalNights: integer("total_nights").notNull(),
  priceBeforeDiscount: decimal("price_before_discount", { precision: 10, scale: 2 }).notNull(), // base * nights
  priceAfterDiscount: decimal("price_after_discount", { precision: 10, scale: 2 }).notNull(), // after length discount
  
  // Fees
  cleaningFee: decimal("cleaning_fee", { precision: 10, scale: 2 }).notNull().default("25.00"),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull().default("15.00"),
  petFee: decimal("pet_fee", { precision: 10, scale: 2 }).default("0.00"),
  cityTax: decimal("city_tax", { precision: 10, scale: 2 }).default("0.00"), // 4€ per adult per night max 5 nights
  
  // Discount tracking
  lengthOfStayDiscount: decimal("length_of_stay_discount", { precision: 10, scale: 2 }).default("0.00"), // 5% (7+ days) or 10% (14+ days)
  lengthOfStayDiscountPercent: integer("length_of_stay_discount_percent").default(0), // 5 or 10
  referralCredit: decimal("referral_credit", { precision: 10, scale: 2 }).default("0.00"), // 5€ per night for referrals
  
  // Promotion and voucher discounts
  promotionDiscount: decimal("promotion_discount", { precision: 10, scale: 2 }).default("0.00"), // Active promotion discount
  promotionDiscountPercent: integer("promotion_discount_percent").default(0), // Promotion discount percentage
  activePromotion: varchar("active_promotion", { length: 255 }), // Name of active promotion
  promoCodeDiscount: decimal("promo_code_discount", { precision: 10, scale: 2 }).default("0.00"), // Promo code discount
  promoCodeDiscountPercent: integer("promo_code_discount_percent").default(0), // Promo code discount percentage
  appliedPromoCode: varchar("applied_promo_code", { length: 50 }), // Applied promo code
  voucherDiscount: decimal("voucher_discount", { precision: 10, scale: 2 }).default("0.00"), // Voucher discount
  appliedVoucher: varchar("applied_voucher", { length: 50 }), // Applied voucher code
  
  otherDiscounts: decimal("other_discounts", { precision: 10, scale: 2 }).default("0.00"), // Manual admin discounts
  totalDiscountAmount: decimal("total_discount_amount", { precision: 10, scale: 2 }).default("0.00"), // Sum of all discounts
  
  // Final totals
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(), // Final amount to pay
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0.00"),
  
  // Payment and booking details
  paymentMethod: varchar("payment_method", { 
    enum: ["online", "property"]
  }).notNull().default("online"),
  paymentStatus: varchar("payment_status", {
    enum: ["pending", "paid", "authorized", "not_required"]
  }).default("pending"),
  
  // Booking creation tracking
  createdBy: varchar("created_by", { enum: ["admin", "guest"] }).notNull().default("guest"),
  bookedForSelf: boolean("booked_for_self").default(true), // true if guest booking for themselves
  
  // Booking source tracking for calendar color-coding
  bookingSource: varchar("booking_source", { 
    enum: ["direct", "airbnb", "booking.com", "blocked", "custom"] 
  }).default("direct"),
  customSourceName: varchar("custom_source_name", { length: 100 }), // For custom third-party integrations
  customSourceColor: varchar("custom_source_color", { length: 7 }), // Hex color code for custom sources
  blockReason: varchar("block_reason", { length: 500 }), // Reason for blocking dates (only for blocked bookings)
  
  // User association and referral tracking
  userId: varchar("user_id").references(() => users.id), // null for non-registered guests
  referredByUserId: varchar("referred_by_user_id").references(() => users.id), // if booking used referral
  
  // Unique identifiers
  confirmationCode: varchar("confirmation_code", { length: 12 }).unique().notNull(), // Unique booking code
  qrCode: text("qr_code"), // QR code data for reservation
  
  // Status tracking
  status: varchar("status", {
    enum: ["pending", "confirmed", "checked_in", "checked_out", "cancelled"]
  }).default("pending"),
  
  // Payment integration
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  
  // Collection tracking
  paymentReceived: boolean("payment_received").default(false),
  paymentReceivedBy: varchar("payment_received_by", { length: 100 }),
  paymentReceivedAt: timestamp("payment_received_at"),
  cityTaxCollected: boolean("city_tax_collected").default(false),
  cityTaxCollectedBy: varchar("city_tax_collected_by", { length: 100 }),
  cityTaxCollectedAt: timestamp("city_tax_collected_at"),
  
  // Pet accommodation
  hasPet: boolean("has_pet").default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  modificationDate: timestamp("modification_date").defaultNow(),
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
  guestEmail: varchar("guest_email", { length: 255 }).notNull(),
  rating: integer("rating").notNull(),
  content: text("content").notNull(),
  cleanlinessRating: integer("cleanliness_rating"),
  accuracyRating: integer("accuracy_rating"),
  locationRating: integer("location_rating"),
  checkinRating: integer("checkin_rating"),
  valueRating: integer("value_rating"),
  communicationRating: integer("communication_rating"),
  isVisible: boolean("is_visible").default(false), // Default to false for admin approval
  isApproved: boolean("is_approved").default(false), // Admin approval required
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

// Promotions
export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  discountPercentage: integer("discount_percentage").notNull(),
  tag: varchar("tag", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Promo codes
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  discountType: varchar("discount_type", { enum: ["percentage", "fixed"] }).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  usageLimit: integer("usage_limit"), // null = unlimited
  usageCount: integer("usage_count").default(0),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }).default("0.00"),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Promo code usage tracking
export const promoCodeUsage = pgTable("promo_code_usage", {
  id: serial("id").primaryKey(),
  promoCodeId: integer("promo_code_id").notNull(),
  bookingId: integer("booking_id").notNull(),
  userId: varchar("user_id"), // null for guest users
  guestEmail: varchar("guest_email").notNull(), // to identify guest users
  guestName: varchar("guest_name").notNull(), // guest first + last name
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

// Vouchers table (distinct from promo codes for admin-created vouchers)
export const vouchers = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  discountType: varchar("discount_type", { enum: ["percentage", "fixed"] }).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  usageLimit: integer("usage_limit").notNull().default(1),
  usageCount: integer("usage_count").notNull().default(0),
  minBookingAmount: decimal("min_booking_amount", { precision: 10, scale: 2 }).default("0.00"),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }), // for percentage discounts
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  createdBy: varchar("created_by").notNull().default("admin"), // admin who created it
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voucher usage tracking
export const voucherUsage = pgTable("voucher_usage", {
  id: serial("id").primaryKey(),
  voucherId: integer("voucher_id").notNull().references(() => vouchers.id),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  userId: varchar("user_id").references(() => users.id), // null for guest users
  guestEmail: varchar("guest_email").notNull(), // to identify guest users
  guestName: varchar("guest_name").notNull(), // guest first + last name
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  bookingAmount: decimal("booking_amount", { precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
  checkInDate: date("check_in_date").notNull(),
  checkOutDate: date("check_out_date").notNull(),
});

// Hero images
export const heroImages = pgTable("hero_images", {
  id: serial("id").primaryKey(),
  url: varchar("url", { length: 500 }).notNull(),
  alt: varchar("alt", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  position: varchar("position", { length: 50 }).notNull(), // 'main', 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pricing settings table
export const pricingSettings = pgTable("pricing_settings", {
  id: serial("id").primaryKey(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull().default("150.00"),
  cleaningFee: decimal("cleaning_fee", { precision: 10, scale: 2 }).notNull().default("25.00"),
  petFee: decimal("pet_fee", { precision: 10, scale: 2 }).notNull().default("35.00"),
  // Dynamic cleaning fees based on stay duration
  cleaningFeeShortStay: decimal("cleaning_fee_short_stay", { precision: 10, scale: 2 }).notNull().default("25.00"), // 1-2 nights
  cleaningFeeLongStay: decimal("cleaning_fee_long_stay", { precision: 10, scale: 2 }).notNull().default("35.00"), // 3+ nights
  // Dynamic pet cleaning fees based on stay duration
  petFeeShortStay: decimal("pet_fee_short_stay", { precision: 10, scale: 2 }).notNull().default("15.00"), // 1-2 nights
  petFeeLongStay: decimal("pet_fee_long_stay", { precision: 10, scale: 2 }).notNull().default("25.00"), // 3+ nights
  discountWeekly: integer("discount_weekly").notNull().default(10),
  discountMonthly: integer("discount_monthly").notNull().default(20),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Activity timeline for tracking all booking events
export const activityTimeline = pgTable("activity_timeline", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id),
  actionType: varchar("action_type", { length: 50 }).notNull(), // 'created', 'modified', 'cancelled', 'checked_in', 'no_show', 'postponed'
  description: text("description").notNull(),
  guestName: varchar("guest_name", { length: 255 }).notNull(),
  guestEmail: varchar("guest_email", { length: 255 }),
  checkInDate: date("check_in_date"),
  checkOutDate: date("check_out_date"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  bookingSource: varchar("booking_source", { length: 50 }),
  performedBy: varchar("performed_by", { length: 255 }), // Who performed the action (admin, guest, system)
  metadata: jsonb("metadata"), // Additional data about the change
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

export const promoCodesRelations = relations(promoCodes, ({ many }) => ({
  usage: many(promoCodeUsage),
}));

export const promoCodeUsageRelations = relations(promoCodeUsage, ({ one }) => ({
  promoCode: one(promoCodes, {
    fields: [promoCodeUsage.promoCodeId],
    references: [promoCodes.id],
  }),
  booking: one(bookings, {
    fields: [promoCodeUsage.bookingId],
    references: [bookings.id],
  }),
  user: one(users, {
    fields: [promoCodeUsage.userId],
    references: [users.id],
  }),
}));

export const vouchersRelations = relations(vouchers, ({ many }) => ({
  usage: many(voucherUsage),
}));

export const voucherUsageRelations = relations(voucherUsage, ({ one }) => ({
  voucher: one(vouchers, {
    fields: [voucherUsage.voucherId],
    references: [vouchers.id],
  }),
  booking: one(bookings, {
    fields: [voucherUsage.bookingId],
    references: [bookings.id],
  }),
  user: one(users, {
    fields: [voucherUsage.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  confirmationCode: true,
  qrCode: true,
  createdAt: true,
  updatedAt: true,
  modificationDate: true,
}).extend({
  // Required guest information validation
  guestFirstName: z.string().min(1, "First name is required").max(100, "First name too long"),
  guestLastName: z.string().min(1, "Last name is required").max(100, "Last name too long"),
  guestEmail: z.string().email("Valid email is required"),
  guestCountry: z.string().min(1, "Country is required"),
  guestPhone: z.string().min(1, "Phone number is required"),
  
  // Booking dates validation
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  guests: z.number().min(1, "At least 1 guest required").max(5, "Maximum 5 guests allowed"),
  
  // Pricing validation
  basePrice: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Valid base price required"),
  totalNights: z.number().min(1, "At least 1 night required").max(15, "Maximum 15 nights allowed"),
  totalPrice: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Valid total price required"),
  
  // Optional fields
  referralCode: z.string().optional(),
  hasPet: z.boolean().optional(),
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

// Guest review schema for public review submission
export const guestReviewSchema = z.object({
  bookingId: z.number().positive("Valid booking ID required"),
  guestName: z.string().min(1, "Guest name is required").max(100, "Name too long"),
  guestEmail: z.string().email("Valid email address required"),
  rating: z.number().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  content: z.string().min(10, "Review must be at least 10 characters").max(1000, "Review too long"),
  cleanlinessRating: z.number().min(1).max(5).optional(),
  accuracyRating: z.number().min(1).max(5).optional(),
  locationRating: z.number().min(1).max(5).optional(),
  checkinRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertAboutContentSchema = createInsertSchema(aboutContent).omit({
  id: true,
  updatedAt: true,
});

export const insertPromotionSchema = createInsertSchema(promotions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  discountPercentage: z.number().min(0).max(100),
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  code: z.string().min(3, "Code must be at least 3 characters").max(50, "Code too long"),
  discountValue: z.number().positive("Discount value must be positive"),
  usageLimit: z.number().positive().optional().nullable(),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().positive().optional().nullable(),
});

export const insertPromoCodeUsageSchema = createInsertSchema(promoCodeUsage).omit({
  id: true,
  usedAt: true,
});

export const insertHeroImageSchema = createInsertSchema(heroImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPricingSettingsSchema = createInsertSchema(pricingSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertActivityTimelineSchema = createInsertSchema(activityTimeline).omit({
  id: true,
  createdAt: true,
});

export const insertVoucherSchema = createInsertSchema(vouchers).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  code: z.string().min(3, "Code must be at least 3 characters").max(50, "Code too long").regex(/^[A-Z0-9]+$/, "Code must contain only uppercase letters and numbers"),
  discountValue: z.number().positive("Discount value must be positive"),
  usageLimit: z.number().positive("Usage limit must be positive"),
  minBookingAmount: z.number().min(0, "Minimum booking amount must be 0 or greater"),
  maxDiscountAmount: z.number().min(0, "Maximum discount amount must be 0 or greater").optional(),
  validFrom: z.string().min(1, "Valid from date is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
  description: z.string().optional(),
});

export const insertVoucherUsageSchema = createInsertSchema(voucherUsage).omit({
  id: true,
  usedAt: true,
});

export const voucherValidationSchema = z.object({
  code: z.string().min(1, "Voucher code is required"),
  bookingAmount: z.number().positive("Booking amount must be positive"),
  guestEmail: z.string().email("Valid email is required"),
  guestName: z.string().min(1, "Guest name is required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
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
export type GuestReview = z.infer<typeof guestReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertAboutContent = z.infer<typeof insertAboutContentSchema>;
export type AboutContent = typeof aboutContent.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Promotion = typeof promotions.$inferSelect;
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCodeUsage = z.infer<typeof insertPromoCodeUsageSchema>;
export type PromoCodeUsage = typeof promoCodeUsage.$inferSelect;
export type InsertPricingSettings = z.infer<typeof insertPricingSettingsSchema>;
export type PricingSettings = typeof pricingSettings.$inferSelect;
export type InsertHeroImage = z.infer<typeof insertHeroImageSchema>;
export type HeroImage = typeof heroImages.$inferSelect;
export type InsertActivityTimeline = z.infer<typeof insertActivityTimelineSchema>;
export type ActivityTimeline = typeof activityTimeline.$inferSelect;
export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type Voucher = typeof vouchers.$inferSelect;
export type InsertVoucherUsage = z.infer<typeof insertVoucherUsageSchema>;
export type VoucherUsage = typeof voucherUsage.$inferSelect;
export type VoucherValidation = z.infer<typeof voucherValidationSchema>;
