CREATE TYPE "public"."checkout_status" AS ENUM('active', 'expired', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('enrolled', 'in_progress', 'completed', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."dispatch_status" AS ENUM('dispatched', 'returned', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('aircraft_wb', 'medical_certificate', 'renters_insurance', 'parts_receipt', 'pilot_certificate', 'other');--> statement-breakpoint
CREATE TYPE "public"."event_dispatch_status" AS ENUM('pending', 'cleared', 'limited', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."ledger_entry_type" AS ENUM('charge', 'payment', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."medical_class" AS ENUM('1st_class', '2nd_class', '3rd_class', 'basicmed');--> statement-breakpoint
CREATE TYPE "public"."pilot_certificate" AS ENUM('student_pilot', 'sport_pilot', 'recreational_pilot', 'private_pilot', 'commercial_pilot', 'atp');--> statement-breakpoint
CREATE TYPE "public"."pilot_certificate_type" AS ENUM('remote_pilot', 'flight_instructor', 'ground_instructor', 'flight_engineer', 'flight_navigator');--> statement-breakpoint
CREATE TYPE "public"."reminder_type" AS ENUM('oil_change', 'elt', '100_hour', 'annual', 'transponder', 'pitot_static', 'registration', 'custom');--> statement-breakpoint
CREATE TYPE "public"."training_status" AS ENUM('enrolled', 'not_enrolled', 'completed', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."tsa_clearance_status" AS ENUM('pending', 'approved', 'denied', 'expired');--> statement-breakpoint
CREATE TYPE "public"."tsa_evidence" AS ENUM('none', 'passport', 'birth_certificate', 'naturalization_certificate', 'permanent_resident_card');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'client';--> statement-breakpoint
CREATE TABLE "aircraft_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "reminder_type" DEFAULT 'custom' NOT NULL,
	"due_hours" real,
	"warning_hours" real DEFAULT 10,
	"due_date" timestamp with time zone,
	"warning_days" integer DEFAULT 30,
	"last_completed_at" timestamp with time zone,
	"last_completed_hours" real,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aircraft_wb_stations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"station_name" text NOT NULL,
	"arm" real NOT NULL,
	"min_weight" real,
	"max_weight" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text,
	"gender" text,
	"date_of_birth" timestamp with time zone,
	"drivers_license" text,
	"passport_number" text,
	"passport_expiry" timestamp with time zone,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_details_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE "client_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text NOT NULL,
	"type" "ledger_entry_type" NOT NULL,
	"quantity" real,
	"amount" real DEFAULT 0 NOT NULL,
	"payment_method" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6B7280' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "dispatch_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"pilot_id" uuid NOT NULL,
	"instructor_id" uuid,
	"status" "dispatch_status" DEFAULT 'dispatched' NOT NULL,
	"hobbs_out" real NOT NULL,
	"tach_out" real NOT NULL,
	"hobbs_in" real,
	"tach_in" real,
	"hobbs_flown" real,
	"tach_flown" real,
	"maintenance_status" text NOT NULL,
	"preflight_checks" jsonb,
	"depart_time" timestamp with time zone NOT NULL,
	"return_time" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid,
	"aircraft_id" uuid,
	"type" "document_type" NOT NULL,
	"file_url" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"extracted_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"cfi_number" text,
	"cfi_expiration" timestamp with time zone,
	"is_authorized" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instructor_settings_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE "instructor_specialties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instructor_specialties_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "instructor_specialty_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instructor_id" uuid NOT NULL,
	"specialty_id" uuid NOT NULL,
	"hourly_rate" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pilot_aircraft_checkouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"checkout_date" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_out_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pilot_checkouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pilot_id" uuid NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"checkout_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"status" "checkout_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pilot_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"course_name" text NOT NULL,
	"status" "course_status" DEFAULT 'enrolled' NOT NULL,
	"enrolled_date" timestamp with time zone DEFAULT now(),
	"completed_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pilot_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"tsa_clearance_status" "tsa_clearance_status",
	"tsa_clearance_expiry" timestamp with time zone,
	"last_flight_review_date" timestamp with time zone,
	"renters_insurance_expiry" timestamp with time zone,
	"medical_class" "medical_class",
	"medical_expiry" timestamp with time zone,
	"certificate_type" "pilot_certificate",
	"certificate_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pilot_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"training_status" "training_status" DEFAULT 'not_enrolled',
	"preferred_location" text,
	"last_flight_review" timestamp with time zone,
	"renters_insurance_expiry" timestamp with time zone,
	"medical_class" "medical_class",
	"medical_expires" timestamp with time zone,
	"ftn" text,
	"solo_date" timestamp with time zone,
	"certificate" "pilot_certificate",
	"certificate_type" "pilot_certificate_type",
	"issued_by" text,
	"date_issued" timestamp with time zone,
	"certificate_number" text,
	"cfi_expiration" timestamp with time zone,
	"craft_categories" jsonb DEFAULT '[]'::jsonb,
	"endorsements" jsonb DEFAULT '[]'::jsonb,
	"class_ratings" jsonb DEFAULT '[]'::jsonb,
	"other_ratings" jsonb DEFAULT '[]'::jsonb,
	"tsa_evidence_shown" "tsa_evidence" DEFAULT 'none',
	"tsa_endorsements_verified" boolean DEFAULT false,
	"tsa_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pilot_info_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE "pilot_preferred_instructors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"instructor_id" uuid NOT NULL,
	"added_date" timestamp with time zone DEFAULT now() NOT NULL,
	"added_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aircraft" ADD COLUMN "hobbs_hours" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "aircraft" ADD COLUMN "tach_hours" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "aircraft" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "aircraft" ADD COLUMN "luggage_capacity_lbs" real;--> statement-breakpoint
ALTER TABLE "aircraft" ADD COLUMN "fuel_usable_gallons" real;--> statement-breakpoint
ALTER TABLE "aircraft" ADD COLUMN "fuel_weight_lbs" real;--> statement-breakpoint
ALTER TABLE "aircraft" ADD COLUMN "fuel_per_wing_gallons" real;--> statement-breakpoint
ALTER TABLE "aircraft" ADD COLUMN "oil_capacity_quarts" text;--> statement-breakpoint
ALTER TABLE "aircraft" ADD COLUMN "max_endurance_hours" real;--> statement-breakpoint
ALTER TABLE "aircraft" ADD COLUMN "v_speeds" jsonb;--> statement-breakpoint
ALTER TABLE "aircraft" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "weight_lbs" real;--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "dispatch_status" text;--> statement-breakpoint
ALTER TABLE "schedule_events" ADD COLUMN "dispatch_data" jsonb;--> statement-breakpoint
ALTER TABLE "aircraft_reminders" ADD CONSTRAINT "aircraft_reminders_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aircraft_wb_stations" ADD CONSTRAINT "aircraft_wb_stations_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_details" ADD CONSTRAINT "client_details_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_ledger" ADD CONSTRAINT "client_ledger_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_logs" ADD CONSTRAINT "dispatch_logs_event_id_schedule_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."schedule_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_logs" ADD CONSTRAINT "dispatch_logs_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_logs" ADD CONSTRAINT "dispatch_logs_pilot_id_profiles_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_logs" ADD CONSTRAINT "dispatch_logs_instructor_id_profiles_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_settings" ADD CONSTRAINT "instructor_settings_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_specialty_assignments" ADD CONSTRAINT "instructor_specialty_assignments_instructor_id_profiles_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_specialty_assignments" ADD CONSTRAINT "instructor_specialty_assignments_specialty_id_instructor_specialties_id_fk" FOREIGN KEY ("specialty_id") REFERENCES "public"."instructor_specialties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_aircraft_checkouts" ADD CONSTRAINT "pilot_aircraft_checkouts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_aircraft_checkouts" ADD CONSTRAINT "pilot_aircraft_checkouts_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_aircraft_checkouts" ADD CONSTRAINT "pilot_aircraft_checkouts_checked_out_by_profiles_id_fk" FOREIGN KEY ("checked_out_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_checkouts" ADD CONSTRAINT "pilot_checkouts_pilot_id_profiles_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_checkouts" ADD CONSTRAINT "pilot_checkouts_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_courses" ADD CONSTRAINT "pilot_courses_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_credentials" ADD CONSTRAINT "pilot_credentials_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_info" ADD CONSTRAINT "pilot_info_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_preferred_instructors" ADD CONSTRAINT "pilot_preferred_instructors_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_preferred_instructors" ADD CONSTRAINT "pilot_preferred_instructors_instructor_id_profiles_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_tags" ADD CONSTRAINT "profile_tags_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_tags" ADD CONSTRAINT "profile_tags_tag_id_client_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."client_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pilot_checkouts_pilot_aircraft_idx" ON "pilot_checkouts" USING btree ("pilot_id","aircraft_id");--> statement-breakpoint
CREATE INDEX "pilot_credentials_profile_medical_idx" ON "pilot_credentials" USING btree ("profile_id","medical_expiry");--> statement-breakpoint
CREATE INDEX "maintenance_jobs_aircraft_status_idx" ON "maintenance_jobs" USING btree ("aircraft_id","status");--> statement-breakpoint
CREATE INDEX "schedule_events_start_time_idx" ON "schedule_events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "schedule_events_aircraft_id_idx" ON "schedule_events" USING btree ("aircraft_id");--> statement-breakpoint
CREATE INDEX "schedule_events_instructor_id_idx" ON "schedule_events" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "schedule_events_student_id_idx" ON "schedule_events" USING btree ("student_id");