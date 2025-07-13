import { pgTable, text, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// PMS Integrations table
export const pmsIntegrations = pgTable("pms_integrations", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Airbnb, Booking.com, etc.
  method: text("method").notNull(), // ICAL or API
  details: text("details").notNull(), // URL for ICAL or API key
  status: text("status").notNull().default("active"), // active, inactive, error
  lastSync: timestamp("last_sync"),
  bookingsCount: integer("bookings_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PMS Bookings table
export const pmsBookings = pgTable("pms_bookings", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: text("integration_id").references(() => pmsIntegrations.id),
  platform: text("platform").notNull(), // Airbnb, Booking.com, etc.
  summary: text("summary").notNull(),
  start: timestamp("start").notNull(),
  end: timestamp("end").notNull(),
  guestName: text("guest_name"),
  status: text("status").notNull().default("confirmed"),
  revenue: integer("revenue").default(0),
  externalId: text("external_id"), // ID from the external platform
  rawData: jsonb("raw_data"), // Store original data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PMS Reviews table
export const pmsReviews = pgTable("pms_reviews", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: text("integration_id").references(() => pmsIntegrations.id),
  platform: text("platform").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  guestName: text("guest_name").notNull(),
  date: timestamp("date").notNull(),
  externalId: text("external_id"), // ID from the external platform
  rawData: jsonb("raw_data"), // Store original data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PMS Messages table
export const pmsMessages = pgTable("pms_messages", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: text("integration_id").references(() => pmsIntegrations.id),
  platform: text("platform").notNull(),
  sender: text("sender").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  read: boolean("read").default(false),
  externalId: text("external_id"), // ID from the external platform
  rawData: jsonb("raw_data"), // Store original data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PMSIntegration = typeof pmsIntegrations.$inferSelect;
export type InsertPMSIntegration = typeof pmsIntegrations.$inferInsert;

export type PMSBooking = typeof pmsBookings.$inferSelect;
export type InsertPMSBooking = typeof pmsBookings.$inferInsert;

export type PMSReview = typeof pmsReviews.$inferSelect;
export type InsertPMSReview = typeof pmsReviews.$inferInsert;

export type PMSMessage = typeof pmsMessages.$inferSelect;
export type InsertPMSMessage = typeof pmsMessages.$inferInsert;
