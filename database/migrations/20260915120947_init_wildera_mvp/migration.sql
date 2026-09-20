-- CreateEnum
BEGIN;

-- CreateEnum
CREATE TYPE "destination_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "difficulty_level" AS ENUM ('EASY', 'MODERATE', 'HARD', 'EXTREME');

-- CreateEnum
CREATE TYPE "content_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "trip_type" AS ENUM ('OPEN_TRIP', 'PRIVATE_TRIP', 'TEKTOK', 'MULTI_DAY');

-- CreateEnum
CREATE TYPE "facility_type" AS ENUM ('INCLUDE', 'EXCLUDE');

-- CreateEnum
CREATE TYPE "gear_type" AS ENUM ('MANDATORY', 'RECOMMENDED');

-- CreateEnum
CREATE TYPE "schedule_status" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "entity_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('INQUIRY', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "booking_source" AS ENUM ('WEBSITE_WHATSAPP', 'WHATSAPP', 'INSTAGRAM', 'ADMIN', 'OTHER');

-- CreateEnum
CREATE TYPE "gender_type" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "identity_type" AS ENUM ('KTP', 'PASSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "private_trip_status" AS ENUM ('NEW', 'CONTACTED', 'QUOTATION_SENT', 'NEGOTIATION', 'BOOKED', 'LOST');

-- CreateEnum
CREATE TYPE "media_role" AS ENUM ('COVER', 'GALLERY');

-- CreateEnum
CREATE TYPE "admin_status" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "destinations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "province" VARCHAR(120),
    "region" VARCHAR(120),
    "description" TEXT,
    "status" "destination_status" NOT NULL DEFAULT 'ACTIVE',
    "seo_title" VARCHAR(160),
    "seo_description" VARCHAR(320),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mountains" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "destination_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "altitude_m" INTEGER,
    "short_description" TEXT,
    "description" TEXT,
    "default_difficulty" "difficulty_level",
    "best_season" VARCHAR(255),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "seo_title" VARCHAR(160),
    "seo_description" VARCHAR(320),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "mountains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mountain_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "distance_km" DECIMAL(6,2),
    "elevation_gain_m" INTEGER,
    "estimated_duration_hours" DECIMAL(5,2),
    "difficulty" "difficulty_level",
    "starting_point" VARCHAR(255),
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mountain_id" UUID NOT NULL,
    "route_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "trip_type" "trip_type" NOT NULL,
    "short_description" TEXT,
    "description" TEXT,
    "duration_days" SMALLINT NOT NULL,
    "duration_nights" SMALLINT NOT NULL DEFAULT 0,
    "difficulty" "difficulty_level" NOT NULL,
    "beginner_friendly" BOOLEAN NOT NULL DEFAULT false,
    "health_certificate_required" BOOLEAN NOT NULL DEFAULT false,
    "minimum_age" SMALLINT,
    "maximum_age" SMALLINT,
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "seo_title" VARCHAR(160),
    "seo_description" VARCHAR(320),
    "published_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_itineraries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "day_number" SMALLINT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_facilities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "facility_type" "facility_type" NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_gears" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "gear_type" "gear_type" NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_gears_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_faqs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "registration_deadline" TIMESTAMPTZ(6),
    "capacity" SMALLINT NOT NULL,
    "minimum_participants" SMALLINT,
    "status" "schedule_status" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_points" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(180) NOT NULL,
    "city" VARCHAR(120),
    "address" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "notes" TEXT,
    "status" "entity_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_packages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schedule_id" UUID NOT NULL,
    "meeting_point_id" UUID,
    "name" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(14,2) NOT NULL,
    "meeting_datetime" TIMESTAMPTZ(6),
    "status" "entity_status" NOT NULL DEFAULT 'ACTIVE',
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" VARCHAR(180) NOT NULL,
    "whatsapp_number" VARCHAR(30) NOT NULL,
    "email" VARCHAR(254),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_number" VARCHAR(40) NOT NULL,
    "customer_id" UUID,
    "schedule_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'INQUIRY',
    "source" "booking_source" NOT NULL,
    "participant_count" SMALLINT NOT NULL,
    "total_amount" DECIMAL(14,2),
    "contact_name" VARCHAR(180) NOT NULL,
    "contact_whatsapp" VARCHAR(30) NOT NULL,
    "contact_email" VARCHAR(254),
    "notes" TEXT,
    "cancellation_reason" TEXT,
    "confirmed_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "full_name" VARCHAR(180) NOT NULL,
    "date_of_birth" DATE,
    "gender" "gender_type",
    "phone" VARCHAR(30),
    "identity_type" "identity_type",
    "identity_number" VARCHAR(100),
    "emergency_contact_name" VARCHAR(180),
    "emergency_contact_phone" VARCHAR(30),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_trip_inquiries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inquiry_number" VARCHAR(40) NOT NULL,
    "mountain_id" UUID,
    "destination_other" VARCHAR(200),
    "customer_name" VARCHAR(180) NOT NULL,
    "whatsapp_number" VARCHAR(30) NOT NULL,
    "email" VARCHAR(254),
    "preferred_date" DATE NOT NULL,
    "alternative_date" DATE,
    "participant_count" SMALLINT NOT NULL,
    "meeting_point_request" VARCHAR(255),
    "budget" DECIMAL(14,2),
    "requirements" TEXT,
    "status" "private_trip_status" NOT NULL DEFAULT 'NEW',
    "assigned_admin_id" UUID,
    "admin_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "private_trip_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "object_key" VARCHAR(500) NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "width_px" INTEGER,
    "height_px" INTEGER,
    "alt_text" VARCHAR(255),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "media_role" "media_role" NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mountain_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mountain_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "media_role" "media_role" NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mountain_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" VARCHAR(100),
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "page_key" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "seo_title" VARCHAR(160),
    "seo_description" VARCHAR(320),
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "setting_key" VARCHAR(120) NOT NULL,
    "setting_value" JSONB NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(180) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "admin_status" NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_user_roles" (
    "admin_user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_user_roles_pkey" PRIMARY KEY ("admin_user_id","role_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_user_id" UUID,
    "action" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(120) NOT NULL,
    "entity_id" UUID,
    "old_value" JSONB,
    "new_value" JSONB,
    "request_id" VARCHAR(100),
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "mountains_slug_key" ON "mountains"("slug");

-- CreateIndex
CREATE INDEX "mountains_destination_id_idx" ON "mountains"("destination_id");

-- CreateIndex
CREATE UNIQUE INDEX "routes_mountain_id_slug_key" ON "routes"("mountain_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "trips_slug_key" ON "trips"("slug");

-- CreateIndex
CREATE INDEX "trips_status_idx" ON "trips"("status");

-- CreateIndex
CREATE INDEX "trips_mountain_id_idx" ON "trips"("mountain_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_itineraries_trip_id_day_number_key" ON "trip_itineraries"("trip_id", "day_number");

-- CreateIndex
CREATE INDEX "trip_facilities_trip_id_idx" ON "trip_facilities"("trip_id");

-- CreateIndex
CREATE INDEX "trip_gears_trip_id_idx" ON "trip_gears"("trip_id");

-- CreateIndex
CREATE INDEX "trip_faqs_trip_id_idx" ON "trip_faqs"("trip_id");

-- CreateIndex
CREATE INDEX "trip_schedules_trip_id_idx" ON "trip_schedules"("trip_id");

-- CreateIndex
CREATE INDEX "trip_schedules_start_date_idx" ON "trip_schedules"("start_date");

-- CreateIndex
CREATE INDEX "trip_schedules_status_start_date_idx" ON "trip_schedules"("status", "start_date");

-- CreateIndex
CREATE INDEX "schedule_packages_schedule_id_idx" ON "schedule_packages"("schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_packages_id_schedule_id_key" ON "schedule_packages"("id", "schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_number_key" ON "bookings"("booking_number");

-- CreateIndex
CREATE INDEX "bookings_schedule_id_status_idx" ON "bookings"("schedule_id", "status");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");

-- CreateIndex
CREATE INDEX "bookings_contact_whatsapp_idx" ON "bookings"("contact_whatsapp");

-- CreateIndex
CREATE INDEX "booking_participants_booking_id_idx" ON "booking_participants"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "private_trip_inquiries_inquiry_number_key" ON "private_trip_inquiries"("inquiry_number");

-- CreateIndex
CREATE INDEX "private_trip_inquiries_status_created_at_idx" ON "private_trip_inquiries"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "private_trip_inquiries_whatsapp_number_idx" ON "private_trip_inquiries"("whatsapp_number");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_object_key_key" ON "media_assets"("object_key");

-- CreateIndex
CREATE INDEX "trip_media_trip_id_idx" ON "trip_media"("trip_id");

-- CreateIndex
CREATE INDEX "mountain_media_mountain_id_idx" ON "mountain_media"("mountain_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_pages_page_key_key" ON "content_pages"("page_key");

-- CreateIndex
CREATE UNIQUE INDEX "content_pages_slug_key" ON "content_pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_setting_key_key" ON "site_settings"("setting_key");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_admin_user_id_idx" ON "audit_logs"("admin_user_id");

-- AddForeignKey
ALTER TABLE "mountains" ADD CONSTRAINT "mountains_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_mountain_id_fkey" FOREIGN KEY ("mountain_id") REFERENCES "mountains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_mountain_id_fkey" FOREIGN KEY ("mountain_id") REFERENCES "mountains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_itineraries" ADD CONSTRAINT "trip_itineraries_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_facilities" ADD CONSTRAINT "trip_facilities_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_gears" ADD CONSTRAINT "trip_gears_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_faqs" ADD CONSTRAINT "trip_faqs_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_schedules" ADD CONSTRAINT "trip_schedules_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_schedules" ADD CONSTRAINT "trip_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_packages" ADD CONSTRAINT "schedule_packages_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "trip_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_packages" ADD CONSTRAINT "schedule_packages_meeting_point_id_fkey" FOREIGN KEY ("meeting_point_id") REFERENCES "meeting_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "trip_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_package_id_schedule_id_fkey" FOREIGN KEY ("package_id", "schedule_id") REFERENCES "schedule_packages"("id", "schedule_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_participants" ADD CONSTRAINT "booking_participants_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_trip_inquiries" ADD CONSTRAINT "private_trip_inquiries_mountain_id_fkey" FOREIGN KEY ("mountain_id") REFERENCES "mountains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_trip_inquiries" ADD CONSTRAINT "private_trip_inquiries_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_media" ADD CONSTRAINT "trip_media_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_media" ADD CONSTRAINT "trip_media_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mountain_media" ADD CONSTRAINT "mountain_media_mountain_id_fkey" FOREIGN KEY ("mountain_id") REFERENCES "mountains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mountain_media" ADD CONSTRAINT "mountain_media_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_roles" ADD CONSTRAINT "admin_user_roles_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_roles" ADD CONSTRAINT "admin_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ERD constraints not expressible in Prisma schema syntax.
ALTER TABLE "trips"
  ADD CONSTRAINT "trips_duration_days_check" CHECK (duration_days >= 1),
  ADD CONSTRAINT "trips_duration_nights_check" CHECK (duration_nights >= 0),
  ADD CONSTRAINT "trips_minimum_age_check" CHECK (minimum_age >= 0),
  ADD CONSTRAINT "trips_age_range_check" CHECK (maximum_age >= minimum_age);

ALTER TABLE "trip_itineraries"
  ADD CONSTRAINT "trip_itineraries_day_number_check" CHECK (day_number >= 1);

ALTER TABLE "trip_schedules"
  ADD CONSTRAINT "trip_schedules_capacity_check" CHECK (capacity > 0),
  ADD CONSTRAINT "trip_schedules_minimum_participants_check" CHECK (minimum_participants >= 1 AND minimum_participants <= capacity),
  ADD CONSTRAINT "trip_schedules_date_range_check" CHECK (end_date >= start_date);

ALTER TABLE "schedule_packages"
  ADD CONSTRAINT "schedule_packages_price_check" CHECK (price >= 0 AND price <> 'NaN'::numeric);

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_participant_count_check" CHECK (participant_count > 0),
  ADD CONSTRAINT "bookings_total_amount_check" CHECK (total_amount >= 0 AND total_amount <> 'NaN'::numeric);

ALTER TABLE "private_trip_inquiries"
  ADD CONSTRAINT "private_trip_inquiries_participant_count_check" CHECK (participant_count > 0),
  ADD CONSTRAINT "private_trip_inquiries_budget_check" CHECK (budget >= 0 AND budget <> 'NaN'::numeric),
  ADD CONSTRAINT "private_trip_inquiries_destination_check" CHECK (mountain_id IS NOT NULL OR NULLIF(btrim(destination_other), '') IS NOT NULL);

-- Append-only history must also resist direct SQL mutations (ERD section 77).
CREATE FUNCTION reject_audit_log_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only' USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER audit_logs_append_only
BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_logs
FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_log_mutation();

COMMIT;
