CREATE TABLE "about_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_timeline" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer,
	"action_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"guest_name" varchar(255) NOT NULL,
	"guest_email" varchar(255),
	"check_in_date" date,
	"check_out_date" date,
	"total_price" numeric(10, 2),
	"booking_source" varchar(50),
	"performed_by" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"icon" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"check_in_date" date NOT NULL,
	"check_out_date" date NOT NULL,
	"check_in_time" time DEFAULT '15:00',
	"check_out_time" time DEFAULT '10:00',
	"guests" integer DEFAULT 1 NOT NULL,
	"guest_first_name" varchar(100) NOT NULL,
	"guest_last_name" varchar(100) NOT NULL,
	"guest_email" varchar(255) NOT NULL,
	"guest_country" varchar(100) NOT NULL,
	"guest_phone" varchar(20) NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"total_nights" integer NOT NULL,
	"price_before_discount" numeric(10, 2) NOT NULL,
	"price_after_discount" numeric(10, 2) NOT NULL,
	"cleaning_fee" numeric(10, 2) DEFAULT '25.00' NOT NULL,
	"service_fee" numeric(10, 2) DEFAULT '15.00' NOT NULL,
	"pet_fee" numeric(10, 2) DEFAULT '0.00',
	"city_tax" numeric(10, 2) DEFAULT '0.00',
	"length_of_stay_discount" numeric(10, 2) DEFAULT '0.00',
	"length_of_stay_discount_percent" integer DEFAULT 0,
	"referral_credit" numeric(10, 2) DEFAULT '0.00',
	"promotion_discount" numeric(10, 2) DEFAULT '0.00',
	"promotion_discount_percent" integer DEFAULT 0,
	"active_promotion" varchar(255),
	"promo_code_discount" numeric(10, 2) DEFAULT '0.00',
	"promo_code_discount_percent" integer DEFAULT 0,
	"applied_promo_code" varchar(50),
	"voucher_discount" numeric(10, 2) DEFAULT '0.00',
	"applied_voucher" varchar(50),
	"other_discounts" numeric(10, 2) DEFAULT '0.00',
	"total_discount_amount" numeric(10, 2) DEFAULT '0.00',
	"total_price" numeric(10, 2) NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0.00',
	"payment_method" varchar DEFAULT 'online' NOT NULL,
	"payment_status" varchar DEFAULT 'pending',
	"created_by" varchar DEFAULT 'guest' NOT NULL,
	"booked_for_self" boolean DEFAULT true,
	"booking_source" varchar DEFAULT 'direct',
	"custom_source_name" varchar(100),
	"custom_source_color" varchar(7),
	"block_reason" varchar(500),
	"user_id" varchar,
	"referred_by_user_id" varchar,
	"confirmation_code" varchar(12) NOT NULL,
	"qr_code" text,
	"status" varchar DEFAULT 'pending',
	"stripe_payment_intent_id" varchar,
	"payment_received" boolean DEFAULT false,
	"payment_received_by" varchar(100),
	"payment_received_at" timestamp,
	"city_tax_collected" boolean DEFAULT false,
	"city_tax_collected_by" varchar(100),
	"city_tax_collected_at" timestamp,
	"has_pet" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"modification_date" timestamp DEFAULT now(),
	CONSTRAINT "bookings_confirmation_code_unique" UNIQUE("confirmation_code")
);
--> statement-breakpoint
CREATE TABLE "hero_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" varchar(500) NOT NULL,
	"alt" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"position" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "logged_out_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"logged_out_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"booking_id" integer,
	"sender_name" varchar(100) NOT NULL,
	"sender_email" varchar(255) NOT NULL,
	"subject" varchar(255),
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"is_from_admin" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pricing_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"base_price" numeric(10, 2) DEFAULT '150.00' NOT NULL,
	"cleaning_fee" numeric(10, 2) DEFAULT '25.00' NOT NULL,
	"pet_fee" numeric(10, 2) DEFAULT '35.00' NOT NULL,
	"cleaning_fee_short_stay" numeric(10, 2) DEFAULT '25.00' NOT NULL,
	"cleaning_fee_long_stay" numeric(10, 2) DEFAULT '35.00' NOT NULL,
	"pet_fee_short_stay" numeric(10, 2) DEFAULT '15.00' NOT NULL,
	"pet_fee_long_stay" numeric(10, 2) DEFAULT '25.00' NOT NULL,
	"discount_weekly" integer DEFAULT 10 NOT NULL,
	"discount_monthly" integer DEFAULT 20 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_code_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"promo_code_id" integer NOT NULL,
	"booking_id" integer NOT NULL,
	"user_id" varchar,
	"guest_email" varchar NOT NULL,
	"guest_name" varchar NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"discount_type" varchar NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"description" text,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"min_order_amount" numeric(10, 2) DEFAULT '0.00',
	"max_discount_amount" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"discount_percentage" integer NOT NULL,
	"tag" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" varchar(500) NOT NULL,
	"alt" varchar(255),
	"is_primary" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer,
	"user_id" varchar,
	"guest_name" varchar(100) NOT NULL,
	"guest_email" varchar(255) NOT NULL,
	"rating" integer NOT NULL,
	"content" text NOT NULL,
	"cleanliness_rating" integer,
	"accuracy_rating" integer,
	"location_rating" integer,
	"checkin_rating" integer,
	"value_rating" integer,
	"communication_rating" integer,
	"is_visible" boolean DEFAULT false,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"profile_image_url" varchar,
	"password" varchar,
	"date_of_birth" date,
	"country" varchar,
	"mobile_number" varchar,
	"referral_code" varchar,
	"referred_by" varchar,
	"referrer_name" varchar,
	"total_referrals" integer DEFAULT 0,
	"account_credits" numeric(10, 2) DEFAULT '0.00',
	"auth_provider" varchar DEFAULT 'local',
	"role" varchar DEFAULT 'guest',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "voucher_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"voucher_id" integer NOT NULL,
	"booking_id" integer NOT NULL,
	"user_id" varchar,
	"guest_email" varchar NOT NULL,
	"guest_name" varchar NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"booking_amount" numeric(10, 2) NOT NULL,
	"used_at" timestamp DEFAULT now(),
	"check_in_date" date NOT NULL,
	"check_out_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"discount_type" varchar NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"description" text,
	"usage_limit" integer DEFAULT 1 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"min_booking_amount" numeric(10, 2) DEFAULT '0.00',
	"max_discount_amount" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp NOT NULL,
	"created_by" varchar DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pms_bookings" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" text,
	"platform" text NOT NULL,
	"summary" text NOT NULL,
	"start" timestamp NOT NULL,
	"end" timestamp NOT NULL,
	"guest_name" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"revenue" integer DEFAULT 0,
	"external_id" text,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pms_integrations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"method" text NOT NULL,
	"details" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_sync" timestamp,
	"bookings_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pms_messages" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" text,
	"platform" text NOT NULL,
	"sender" text NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"read" boolean DEFAULT false,
	"external_id" text,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pms_reviews" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" text,
	"platform" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"guest_name" text NOT NULL,
	"date" timestamp NOT NULL,
	"external_id" text,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_timeline" ADD CONSTRAINT "activity_timeline_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_referred_by_user_id_users_id_fk" FOREIGN KEY ("referred_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_usage" ADD CONSTRAINT "voucher_usage_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_usage" ADD CONSTRAINT "voucher_usage_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_usage" ADD CONSTRAINT "voucher_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pms_bookings" ADD CONSTRAINT "pms_bookings_integration_id_pms_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."pms_integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pms_messages" ADD CONSTRAINT "pms_messages_integration_id_pms_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."pms_integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pms_reviews" ADD CONSTRAINT "pms_reviews_integration_id_pms_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."pms_integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");