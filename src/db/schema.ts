import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  real,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "instructor",
  "student",
  "mechanic",
  "customer",
  "client",
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

export const reminderTypeEnum = pgEnum("reminder_type", [
  "oil_change",
  "elt",
  "100_hour",
  "annual",
  "transponder",
  "pitot_static",
  "registration",
  "custom",
]);

export const dispatchStatusEnum = pgEnum("dispatch_status", [
  "dispatched",
  "returned",
  "cancelled",
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
  hobbsHours: real("hobbs_hours").notNull().default(0),
  tachHours: real("tach_hours").notNull().default(0),
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
  dispatchStatus: text("dispatch_status"), // null | "dispatched" | "returned"
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

// ── New Tables ─────────────────────────────────────────

export const aircraftReminders = pgTable("aircraft_reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  aircraftId: uuid("aircraft_id")
    .notNull()
    .references(() => aircraft.id),
  name: text("name").notNull(),
  type: reminderTypeEnum("type").notNull().default("custom"),
  dueHours: real("due_hours"),
  warningHours: real("warning_hours").default(10),
  dueDate: timestamp("due_date", { withTimezone: true }),
  warningDays: integer("warning_days").default(30),
  lastCompletedAt: timestamp("last_completed_at", { withTimezone: true }),
  lastCompletedHours: real("last_completed_hours"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const dispatchLogs = pgTable("dispatch_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => scheduleEvents.id),
  aircraftId: uuid("aircraft_id")
    .notNull()
    .references(() => aircraft.id),
  pilotId: uuid("pilot_id")
    .notNull()
    .references(() => profiles.id),
  instructorId: uuid("instructor_id").references(() => profiles.id),
  status: dispatchStatusEnum("status").notNull().default("dispatched"),
  hobbsOut: real("hobbs_out").notNull(),
  tachOut: real("tach_out").notNull(),
  hobbsIn: real("hobbs_in"),
  tachIn: real("tach_in"),
  hobbsFlown: real("hobbs_flown"),
  tachFlown: real("tach_flown"),
  maintenanceStatus: text("maintenance_status").notNull(), // pass | review | fail
  preflightChecks: jsonb("preflight_checks"),
  departTime: timestamp("depart_time", { withTimezone: true }).notNull(),
  returnTime: timestamp("return_time", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const clientTags = pgTable("client_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#6B7280"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const profileTags = pgTable("profile_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => clientTags.id, { onDelete: "cascade" }),
});

export const clientDetails = pgTable("client_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .unique()
    .references(() => profiles.id),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  gender: text("gender"),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  driversLicense: text("drivers_license"),
  passportNumber: text("passport_number"),
  passportExpiry: timestamp("passport_expiry", { withTimezone: true }),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "charge",
  "payment",
  "adjustment",
]);

// ── Pilot Enums ───────────────────────────────────────

export const trainingStatusEnum = pgEnum("training_status", [
  "enrolled",
  "not_enrolled",
  "completed",
  "withdrawn",
]);

export const courseStatusEnum = pgEnum("course_status", [
  "enrolled",
  "in_progress",
  "completed",
  "dropped",
]);

export const medicalClassEnum = pgEnum("medical_class", [
  "1st_class",
  "2nd_class",
  "3rd_class",
  "basicmed",
]);

export const pilotCertificateEnum = pgEnum("pilot_certificate", [
  "student_pilot",
  "sport_pilot",
  "recreational_pilot",
  "private_pilot",
  "commercial_pilot",
  "atp",
]);

export const pilotCertificateTypeEnum = pgEnum("pilot_certificate_type", [
  "remote_pilot",
  "flight_instructor",
  "ground_instructor",
  "flight_engineer",
  "flight_navigator",
]);

export const tsaEvidenceEnum = pgEnum("tsa_evidence", [
  "none",
  "passport",
  "birth_certificate",
  "naturalization_certificate",
  "permanent_resident_card",
]);

export const clientLedger = pgTable("client_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  description: text("description").notNull(),
  type: ledgerEntryTypeEnum("type").notNull(),
  quantity: real("quantity"),
  amount: real("amount").notNull().default(0),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Pilot Tables ──────────────────────────────────────

export const pilotInfo = pgTable("pilot_info", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .unique()
    .references(() => profiles.id),

  // Training
  trainingStatus: trainingStatusEnum("training_status").default("not_enrolled"),

  // Preferred Location
  preferredLocation: text("preferred_location"),

  // Currency
  lastFlightReview: timestamp("last_flight_review", { withTimezone: true }),
  rentersInsuranceExpiry: timestamp("renters_insurance_expiry", { withTimezone: true }),
  medicalClass: medicalClassEnum("medical_class"),
  medicalExpires: timestamp("medical_expires", { withTimezone: true }),

  // Certificate Information
  ftn: text("ftn"),
  soloDate: timestamp("solo_date", { withTimezone: true }),
  certificate: pilotCertificateEnum("certificate"),
  certificateType: pilotCertificateTypeEnum("certificate_type"),
  issuedBy: text("issued_by"),
  dateIssued: timestamp("date_issued", { withTimezone: true }),
  certificateNumber: text("certificate_number"),
  cfiExpiration: timestamp("cfi_expiration", { withTimezone: true }),

  // Categories, Ratings & Endorsements (JSONB arrays)
  craftCategories: jsonb("craft_categories").$type<string[]>().default([]),
  endorsements: jsonb("endorsements").$type<string[]>().default([]),
  classRatings: jsonb("class_ratings").$type<string[]>().default([]),
  otherRatings: jsonb("other_ratings").$type<string[]>().default([]),

  // TSA Security Clearance
  tsaEvidenceShown: tsaEvidenceEnum("tsa_evidence_shown").default("none"),
  tsaEndorsementsVerified: boolean("tsa_endorsements_verified").default(false),
  tsaNotes: text("tsa_notes"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const pilotCourses = pgTable("pilot_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id),
  courseName: text("course_name").notNull(),
  status: courseStatusEnum("status").notNull().default("enrolled"),
  enrolledDate: timestamp("enrolled_date", { withTimezone: true }).defaultNow(),
  completedDate: timestamp("completed_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pilotAircraftCheckouts = pgTable("pilot_aircraft_checkouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id),
  aircraftId: uuid("aircraft_id")
    .notNull()
    .references(() => aircraft.id),
  checkoutDate: timestamp("checkout_date", { withTimezone: true })
    .notNull()
    .defaultNow(),
  checkedOutBy: uuid("checked_out_by")
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pilotPreferredInstructors = pgTable("pilot_preferred_instructors", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id),
  instructorId: uuid("instructor_id")
    .notNull()
    .references(() => profiles.id),
  addedDate: timestamp("added_date", { withTimezone: true })
    .notNull()
    .defaultNow(),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Instructor Tables ─────────────────────────────────

export const instructorSpecialties = pgTable("instructor_specialties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const instructorSettings = pgTable("instructor_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .unique()
    .references(() => profiles.id),
  cfiNumber: text("cfi_number"),
  cfiExpiration: timestamp("cfi_expiration", { withTimezone: true }),
  isAuthorized: boolean("is_authorized").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const instructorSpecialtyAssignments = pgTable("instructor_specialty_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  instructorId: uuid("instructor_id")
    .notNull()
    .references(() => profiles.id),
  specialtyId: uuid("specialty_id")
    .notNull()
    .references(() => instructorSpecialties.id, { onDelete: "cascade" }),
  hourlyRate: real("hourly_rate").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
