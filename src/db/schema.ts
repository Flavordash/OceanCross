import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "instructor",
  "student",
  "mechanic",
  "customer",
]);

export const aircraftStatusEnum = pgEnum("aircraft_status", [
  "available",
  "in_maintenance",
  "grounded",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "flight_training",
  "maintenance",
  "exam",
  "ground_school",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "scheduled",
  "completed",
  "cancelled",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "pending_parts",
  "scheduled",
  "in_progress",
  "completed",
]);

export const partsOrderStatusEnum = pgEnum("parts_order_status", [
  "ordered",
  "shipped",
  "delivered",
]);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "sms",
  "push",
]);

// ── Tables ─────────────────────────────────────────────

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // Supabase Auth uid
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const aircraft = pgTable("aircraft", {
  id: uuid("id").primaryKey().defaultRandom(),
  registration: text("registration").notNull().unique(), // N number
  type: text("type").notNull(),
  model: text("model").notNull(),
  status: aircraftStatusEnum("status").notNull().default("available"),
  totalHours: integer("total_hours").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const scheduleEvents = pgTable("schedule_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  type: eventTypeEnum("type").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  aircraftId: uuid("aircraft_id").references(() => aircraft.id),
  instructorId: uuid("instructor_id").references(() => profiles.id),
  studentId: uuid("student_id").references(() => profiles.id),
  status: eventStatusEnum("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const maintenanceJobs = pgTable("maintenance_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  aircraftId: uuid("aircraft_id")
    .notNull()
    .references(() => aircraft.id),
  description: text("description").notNull(),
  status: maintenanceStatusEnum("status").notNull().default("pending_parts"),
  mechanicId: uuid("mechanic_id").references(() => profiles.id),
  bay: text("bay"),
  estimatedStart: timestamp("estimated_start", { withTimezone: true }),
  estimatedEnd: timestamp("estimated_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const partsOrders = pgTable("parts_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .notNull()
    .references(() => maintenanceJobs.id),
  partName: text("part_name").notNull(),
  supplier: text("supplier"),
  orderDate: timestamp("order_date", { withTimezone: true })
    .notNull()
    .defaultNow(),
  estimatedArrival: timestamp("estimated_arrival", { withTimezone: true }),
  actualArrival: timestamp("actual_arrival", { withTimezone: true }),
  status: partsOrderStatusEnum("status").notNull().default("ordered"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id),
  type: text("type").notNull(),
  message: text("message").notNull(),
  channel: notificationChannelEnum("channel").notNull().default("email"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
