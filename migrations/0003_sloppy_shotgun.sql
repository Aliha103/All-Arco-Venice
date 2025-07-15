CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" varchar,
	"sender_name" varchar(100) NOT NULL,
	"sender_email" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"message_type" varchar DEFAULT 'text',
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"is_from_admin" boolean DEFAULT false,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"edited_at" timestamp,
	"reply_to" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"user_id" varchar,
	"guest_email" varchar(255),
	"role" varchar DEFAULT 'guest',
	"joined_at" timestamp DEFAULT now(),
	"last_seen_at" timestamp DEFAULT now(),
	"notifications" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"guest_name" varchar(100),
	"guest_email" varchar(255),
	"subject" varchar(255),
	"status" varchar DEFAULT 'active',
	"last_message_at" timestamp DEFAULT now(),
	"assigned_to" varchar,
	"priority" varchar DEFAULT 'medium',
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "message_delivery" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"recipient_id" varchar,
	"recipient_email" varchar(255),
	"delivered_at" timestamp DEFAULT now(),
	"read_at" timestamp,
	"status" varchar DEFAULT 'sent'
);
--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"resource" varchar NOT NULL,
	"resource_id" varchar,
	"details" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"session_id" varchar,
	"success" boolean DEFAULT true,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"description" text,
	"permissions" jsonb NOT NULL,
	"color" varchar DEFAULT '#3b82f6',
	"priority" serial DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"session_token" varchar NOT NULL,
	"device_info" jsonb,
	"ip_address" varchar,
	"location" jsonb,
	"mfa_verified" boolean DEFAULT false,
	"totp_verified" boolean DEFAULT false,
	"sms_verified" boolean DEFAULT false,
	"risk_score" serial DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_activity_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"admin_id" varchar NOT NULL,
	"role_id" serial NOT NULL,
	"custom_permissions" jsonb,
	"restrictions" jsonb,
	"access_level" varchar DEFAULT 'limited',
	"allowed_properties" jsonb,
	"allowed_features" jsonb,
	"is_active" boolean DEFAULT true,
	"last_access_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider_id" varchar;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_reply_to_chat_messages_id_fk" FOREIGN KEY ("reply_to") REFERENCES "public"."chat_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_delivery" ADD CONSTRAINT "message_delivery_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_delivery" ADD CONSTRAINT "message_delivery_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_role_id_admin_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "admin_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "admin_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "admin_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "admin_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "session_expires_idx" ON "admin_sessions" USING btree ("expires_at");