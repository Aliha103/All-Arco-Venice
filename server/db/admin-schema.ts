import { pgTable, text, varchar, timestamp, jsonb, serial, boolean, index } from "drizzle-orm/pg-core";

// Advanced admin roles with granular permissions
export const adminRoles = pgTable("admin_roles", {
  id: serial("id").primaryKey(),
  name: varchar("name").unique().notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  permissions: jsonb("permissions").notNull(), // JSON array of permission strings
  color: varchar("color").default("#3b82f6"), // UI color for role display
  priority: serial("priority").default(0), // Higher priority = more access
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team member assignments with role overrides
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  adminId: varchar("admin_id").notNull(), // Who added this team member
  roleId: serial("role_id").references(() => adminRoles.id),
  customPermissions: jsonb("custom_permissions"), // Override specific permissions
  restrictions: jsonb("restrictions"), // What they can't access
  accessLevel: varchar("access_level", { 
    enum: ["full", "limited", "read_only", "custom"] 
  }).default("limited"),
  allowedProperties: jsonb("allowed_properties"), // Array of property IDs they can manage
  allowedFeatures: jsonb("allowed_features"), // Specific features they can access
  isActive: boolean("is_active").default(true),
  lastAccessAt: timestamp("last_access_at"),
  expiresAt: timestamp("expires_at"), // Optional access expiry
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit log for all admin actions
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  action: varchar("action").notNull(), // e.g., "create_booking", "delete_user"
  resource: varchar("resource").notNull(), // e.g., "booking", "user", "property"
  resourceId: varchar("resource_id"), // ID of the affected resource
  details: jsonb("details"), // Additional action details
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id"),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("audit_user_idx").on(table.userId),
  index("audit_action_idx").on(table.action),
  index("audit_created_idx").on(table.createdAt),
]);

// Security sessions for enhanced MFA tracking
export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  sessionToken: varchar("session_token").unique().notNull(),
  deviceInfo: jsonb("device_info"),
  ipAddress: varchar("ip_address"),
  location: jsonb("location"), // Geolocation data
  mfaVerified: boolean("mfa_verified").default(false),
  totpVerified: boolean("totp_verified").default(false),
  smsVerified: boolean("sms_verified").default(false),
  riskScore: serial("risk_score").default(0), // 0-100 risk assessment
  isActive: boolean("is_active").default(true),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("session_user_idx").on(table.userId),
  index("session_token_idx").on(table.sessionToken),
  index("session_expires_idx").on(table.expiresAt),
]);

// Default permission sets
export const PERMISSIONS = {
  // Booking Management
  BOOKINGS_VIEW: "bookings:view",
  BOOKINGS_CREATE: "bookings:create", 
  BOOKINGS_EDIT: "bookings:edit",
  BOOKINGS_DELETE: "bookings:delete",
  BOOKINGS_EXPORT: "bookings:export",
  
  // User Management
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_EDIT: "users:edit", 
  USERS_DELETE: "users:delete",
  USERS_IMPERSONATE: "users:impersonate",
  
  // Property Management
  PROPERTIES_VIEW: "properties:view",
  PROPERTIES_CREATE: "properties:create",
  PROPERTIES_EDIT: "properties:edit",
  PROPERTIES_DELETE: "properties:delete",
  PROPERTIES_PRICING: "properties:pricing",
  
  // Financial
  FINANCIAL_VIEW: "financial:view",
  FINANCIAL_REPORTS: "financial:reports",
  FINANCIAL_REFUNDS: "financial:refunds",
  FINANCIAL_EXPORT: "financial:export",
  
  // Team Management
  TEAM_VIEW: "team:view",
  TEAM_CREATE: "team:create",
  TEAM_EDIT: "team:edit",
  TEAM_DELETE: "team:delete",
  TEAM_ROLES: "team:roles",
  
  // System
  SYSTEM_SETTINGS: "system:settings",
  SYSTEM_LOGS: "system:logs",
  SYSTEM_BACKUP: "system:backup",
  SYSTEM_MAINTENANCE: "system:maintenance",
  
  // Analytics
  ANALYTICS_VIEW: "analytics:view",
  ANALYTICS_ADVANCED: "analytics:advanced",
  ANALYTICS_EXPORT: "analytics:export",
  
  // Security
  SECURITY_MFA: "security:mfa",
  SECURITY_AUDIT: "security:audit",
  SECURITY_SESSIONS: "security:sessions",
} as const;

// Default roles configuration
export const DEFAULT_ROLES = [
  {
    name: "super_admin",
    displayName: "Super Administrator",
    description: "Full system access with all permissions",
    permissions: Object.values(PERMISSIONS),
    color: "#dc2626",
    priority: 1000,
  },
  {
    name: "admin",
    displayName: "Administrator", 
    description: "Standard admin access without system-level permissions",
    permissions: [
      PERMISSIONS.BOOKINGS_VIEW, PERMISSIONS.BOOKINGS_CREATE, PERMISSIONS.BOOKINGS_EDIT,
      PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_EDIT,
      PERMISSIONS.PROPERTIES_VIEW, PERMISSIONS.PROPERTIES_CREATE, PERMISSIONS.PROPERTIES_EDIT,
      PERMISSIONS.FINANCIAL_VIEW, PERMISSIONS.FINANCIAL_REPORTS,
      PERMISSIONS.ANALYTICS_VIEW,
    ],
    color: "#2563eb",
    priority: 800,
  },
  {
    name: "manager",
    displayName: "Property Manager",
    description: "Manage properties and bookings",
    permissions: [
      PERMISSIONS.BOOKINGS_VIEW, PERMISSIONS.BOOKINGS_CREATE, PERMISSIONS.BOOKINGS_EDIT,
      PERMISSIONS.PROPERTIES_VIEW, PERMISSIONS.PROPERTIES_EDIT, PERMISSIONS.PROPERTIES_PRICING,
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
    ],
    color: "#059669",
    priority: 600,
  },
  {
    name: "support",
    displayName: "Customer Support",
    description: "Handle customer inquiries and basic booking management",
    permissions: [
      PERMISSIONS.BOOKINGS_VIEW, PERMISSIONS.BOOKINGS_EDIT,
      PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_EDIT,
      PERMISSIONS.PROPERTIES_VIEW,
    ],
    color: "#7c3aed",
    priority: 400,
  },
  {
    name: "viewer",
    displayName: "Read Only",
    description: "View-only access to most data",
    permissions: [
      PERMISSIONS.BOOKINGS_VIEW,
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.PROPERTIES_VIEW,
      PERMISSIONS.FINANCIAL_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
    ],
    color: "#6b7280",
    priority: 200,
  },
] as const;