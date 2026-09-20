Saya sedang membangun website production untuk bisnis open trip / private trip gunung bernama **Wildera Adventure**.

Project ini akan dikembangkan berdasarkan enam dokumen utama berikut yang harus dianggap sebagai **source of truth**:

```text
docs/
├── 01_PRD_Wildera_Adventure.md
├── 02_UX_Specification_Wildera.md
├── 03_Technical_Architecture_Wildera.md
├── 04_Database_ERD_Wildera.md
├── 05_API_Specification_Wildera.md
└── 06_Development_Backlog_Wildera.md
```

Jangan membuat requirement baru yang bertentangan dengan dokumen tersebut.

Jika ada konflik:

```text
01 PRD
↓
02 UX Specification
↓
03 Technical Architecture
↓
04 Database ERD
↓
05 API Specification
↓
06 Development Backlog
```

Dokumen dengan posisi lebih atas memiliki authority lebih tinggi untuk konteks masing-masing.

---

# PROJECT OBJECTIVE

MVP Wildera Adventure harus dapat menjalankan flow bisnis utama berikut:

```text
Customer
↓
Homepage / Trip Catalog
↓
Trip Detail
↓
Select Schedule
↓
Select Package
↓
Book via WhatsApp
```

kemudian secara operational:

```text
Customer WhatsApp
↓
Admin
↓
Manual Booking
↓
Booking Confirmation
↓
Capacity Updated
↓
Participant Management
```

Private Trip:

```text
Visitor
↓
Private Trip Page
↓
Inquiry Form
↓
Admin Lead
↓
Follow Up
```

---

# IMPORTANT MVP SCOPE

MVP mencakup:

* Homepage
* Destination
* Mountain
* Route
* Trip
* Trip Schedule
* Schedule Package
* Meeting Point
* Trip Detail
* WhatsApp booking CTA
* Admin authentication
* RBAC
* Manual booking
* Capacity per schedule
* Participant management
* Private Trip inquiry
* CMS basic
* Media upload
* SEO
* Analytics
* Audit log

---

# EXPLICITLY OUTSIDE MVP

Jangan implementasikan sekarang:

```text
Online Checkout

Payment Gateway

Midtrans

Xendit

Virtual Account

QRIS Payment

DP Automation

Pelunasan Automation

Payment Webhook

Customer Account

Customer Login

Seat Reservation Timer

Redis

Kafka

RabbitMQ

Microservices

Kubernetes

Loyalty

Referral

Voucher

Rental Marketplace

Merchandise
```

Jangan menambahkan teknologi atau fitur tersebut kecuali saya secara eksplisit meminta perubahan scope.

---

# APPROVED TECH STACK

Gunakan:

```text
Frontend:
Next.js
React
TypeScript
Tailwind CSS

Backend:
NestJS
TypeScript
REST API

Database:
PostgreSQL

ORM:
Prisma

Storage:
S3-compatible object storage

Architecture:
Modular Monolith

Repository:
Monorepo
```

---

# CORE BUSINESS RULES

Business rule berikut **tidak boleh dilanggar**.

## Rule 1 — Trip ≠ Schedule

```text
Trip
=
Reusable product/template
```

Contoh:

```text
Open Trip Gunung Prau via Patak Banteng
```

Schedule:

```text
19–20 September 2026
```

Satu Trip dapat mempunyai banyak Schedule.

---

## Rule 2 — Capacity belongs to Schedule

Capacity berada pada:

```text
trip_schedules.capacity
```

Bukan pada package.

---

## Rule 3 — Package shares Schedule capacity

Contoh:

```text
Schedule Capacity = 20

Package:
Start Jakarta

Package:
Start Basecamp
```

Keduanya menggunakan inventory 20 seat yang sama.

---

## Rule 4 — Do not store available_seats

Jangan membuat field editable:

```text
available_seats
```

Availability dihitung:

```text
available_seats
=
schedule.capacity
-
SUM(participant_count booking CONFIRMED)
```

---

## Rule 5 — Booking confirmation must be transactional

Jika booking menjadi:

```text
CONFIRMED
```

backend harus:

```text
BEGIN TRANSACTION

Lock Schedule

Calculate Confirmed Seats

Check Capacity

Confirm Booking

COMMIT
```

Jika capacity tidak cukup:

```text
ROLLBACK
```

---

## Rule 6 — Prevent overselling

Jika:

```text
Capacity = 20
Confirmed = 19
```

dan dua admin mencoba mengkonfirmasi masing-masing 1 seat secara bersamaan:

expected:

```text
1 SUCCESS
1 REJECTED
```

Tidak boleh menjadi:

```text
21 / 20
```

---

## Rule 7 — Booking via WhatsApp

Customer tidak membuat booking langsung dari website.

Flow MVP:

```text
Trip Detail
↓
Schedule
↓
Package
↓
WhatsApp
```

Admin kemudian membuat booking secara manual.

---

# DEVELOPMENT METHOD

Kerjakan project secara:

> **incremental + vertical slice**

Jangan langsung membangun seluruh frontend, seluruh backend, atau seluruh database sekaligus.

Setiap tahap harus menghasilkan functionality yang dapat diuji.

---

# IMPORTANT WORKING RULE

Kerjakan hanya **satu STEP utama pada satu waktu**.

Setelah menyelesaikan setiap step:

1. Jelaskan apa yang dibuat.
2. Tampilkan file yang dibuat/diubah.
3. Jelaskan command untuk menjalankan.
4. Jalankan lint/typecheck/test yang relevan.
5. Laporkan error jika ada.
6. Perbaiki error yang ditemukan.
7. Cocokkan hasil dengan acceptance criteria.
8. Berikan status:

```text
STEP STATUS:
PASS
```

atau:

```text
STEP STATUS:
BLOCKED
```

Jika PASS, baru lanjut ke step berikutnya.

Jangan melompati dependency.

---

# PHASE 0 — DOCUMENT VALIDATION

Sebelum coding:

Baca:

```text
01_PRD_Wildera_Adventure.md
02_UX_Specification_Wildera.md
03_Technical_Architecture_Wildera.md
04_Database_ERD_Wildera.md
05_API_Specification_Wildera.md
06_Development_Backlog_Wildera.md
```

Buat ringkasan:

```text
MVP Scope

Architecture

Core Entities

Core Business Rules

Critical Dependencies
```

Kemudian identifikasi apakah terdapat konflik antar dokumen.

Jika tidak ada blocking conflict:

lanjut ke Sprint 0.

Jangan mengubah requirement sendiri.

---

# STEP 1 — INITIALIZE MONOREPO

Buat struktur:

```text
wildera-adventure/

apps/
├── web/
└── api/

packages/
├── ui/
├── types/
├── validation/
└── config/

docs/

database/
├── migrations/
└── seeds/

infrastructure/

scripts/
```

Frontend:

```text
apps/web
```

Next.js + TypeScript.

Backend:

```text
apps/api
```

NestJS + TypeScript.

Configure:

* package manager
* workspace
* TypeScript
* ESLint
* formatting
* gitignore
* environment example
* shared scripts

Root scripts minimal:

```text
dev

build

lint

typecheck

test
```

Acceptance criteria:

```text
frontend dapat dijalankan

backend dapat dijalankan

root command dapat menjalankan project

lint pass

typecheck pass
```

Setelah selesai, berhenti dan laporkan hasil.

---

# STEP 2 — POSTGRESQL + PRISMA FOUNDATION

Setup:

```text
PostgreSQL
Prisma
```

Buat:

```text
DATABASE_URL
```

Implementasikan Prisma schema awal sesuai:

```text
04_Database_ERD_Wildera.md
```

Jangan membuat semua future table.

Implement P0 terlebih dahulu:

```text
Destination
Mountain
Route
Trip
TripItinerary
TripFacility
TripGear
TripFaq
TripSchedule
MeetingPoint
SchedulePackage
Customer
Booking
BookingParticipant
PrivateTripInquiry
MediaAsset
TripMedia
MountainMedia
Faq
ContentPage
SiteSetting
AdminUser
Role
AdminUserRole
AuditLog
```

Create migration:

```text
init_wildera_mvp
```

Acceptance criteria:

```text
migration succeeds

database schema created

foreign keys valid

enums created

Prisma generate succeeds
```

---

# STEP 3 — DATABASE SEED

Create development seeds.

Minimum:

```text
SUPER_ADMIN role

OPERATIONS role

CONTENT role

1 admin user

1 destination

1 mountain

1 route

1 trip

1 schedule

2 packages

1 meeting point
```

Example:

```text
Gunung Prau

Prau via Patak Banteng

Open Trip Prau

Schedule:
19-20 September

Capacity:
20

Package:
Start Jakarta

Package:
Start Basecamp
```

Acceptance criteria:

developer can reset database and reproduce development data.

---

# STEP 4 — BACKEND FOUNDATION

Create NestJS modules:

```text
auth

admin

destination

mountain

route

trip

schedule

package

booking

participant

private-trip

content

media

setting

audit
```

Create common modules:

```text
database

config

logger

error handling
```

API prefix:

```text
/api/v1
```

Create:

```text
GET /health
```

Acceptance criteria:

```text
API boots

database connection works

GET /health returns healthy
```

---

# STEP 5 — ADMIN AUTHENTICATION

Implement:

```text
POST /api/v1/auth/login

POST /api/v1/auth/logout

GET /api/v1/auth/me
```

Requirements:

* admin email/password
* Argon2id preferred
* HttpOnly cookie
* secure production cookie
* disabled admin cannot login

Do not store auth token in localStorage.

Acceptance tests:

```text
valid login → success

wrong password → 401

unknown email → 401

disabled account → rejected

logout → session invalid
```

---

# STEP 6 — RBAC

Roles:

```text
SUPER_ADMIN
OPERATIONS
CONTENT
```

Backend must enforce authorization.

Minimum rules:

```text
SUPER_ADMIN
= full access

OPERATIONS
= trip/schedule/booking/participant/private trip

CONTENT
= catalog/content management
```

CONTENT must NOT be able to:

```text
confirm booking

cancel booking

view sensitive participant data
```

Acceptance criteria:

direct API access with wrong role returns:

```text
403 FORBIDDEN
```

---

# STEP 7 — ADMIN LAYOUT

Build admin frontend.

Routes:

```text
/admin/login

/admin/dashboard

/admin/destinations

/admin/mountains

/admin/routes

/admin/trips

/admin/schedules

/admin/bookings

/admin/private-trips

/admin/content

/admin/settings
```

Create:

* protected admin layout
* sidebar
* header
* loading state
* forbidden state

Do not prioritize decorative styling yet.

---

# STEP 8 — DESTINATION CRUD

Implement DB/API/UI end-to-end.

Endpoints:

```text
GET /admin/destinations

POST /admin/destinations

GET /admin/destinations/:id

PATCH /admin/destinations/:id
```

Fields according to Database ERD.

Acceptance:

Admin can:

```text
create
edit
list
archive/inactivate
```

Destination.

---

# STEP 9 — MOUNTAIN CRUD

Implement vertical slice:

```text
Database
↓
API
↓
Admin UI
```

Fields:

```text
Destination

Name

Slug

Altitude

Difficulty

Description

Best Season

Coordinates

SEO
```

Acceptance:

Admin can create Mountain tied to Destination.

---

# STEP 10 — ROUTE CRUD

Implement:

```text
Mountain
↓
Routes
```

Example:

```text
Rinjani

Sembalun
Senaru
Torean
```

Acceptance:

one Mountain supports multiple Routes.

---

# STEP 11 — TRIP CORE CRUD

Implement Trip.

Fields:

```text
Mountain

Route

Name

Slug

Trip Type

Description

Duration

Difficulty

Beginner Friendly

Health Certificate Required

Minimum Age

Featured

SEO
```

Default:

```text
DRAFT
```

Create admin list and editor.

Do not implement schedules inside Trip record.

---

# STEP 12 — TRIP CONTENT

Implement subresources:

```text
Itinerary

Include

Exclude

Mandatory Gear

Recommended Gear

Trip FAQ
```

Admin UI should support dynamic add/remove/reorder.

Trip should not store itinerary as one giant unstructured blob.

---

# STEP 13 — MEDIA

Implement image upload.

Object storage:

```text
S3-compatible
```

Backend validates:

```text
MIME type

file size

extension
```

Implement:

```text
MediaAsset

TripMedia

MountainMedia
```

Support:

```text
COVER
GALLERY
```

P0 at minimum requires cover.

---

# STEP 14 — TRIP PUBLISHING

Implement:

```text
POST /admin/trips/:id/publish
```

Backend validates required fields.

Do not allow incomplete trip to publish.

Also implement:

```text
archive

duplicate
```

Duplicate must NOT copy:

```text
schedules
bookings
```

---

# STEP 15 — SCHEDULE MANAGEMENT

Implement:

```text
Trip
↓
Schedule
```

Fields:

```text
Start Date

End Date

Registration Deadline

Capacity

Minimum Participants

Status
```

Lifecycle:

```text
DRAFT
OPEN
CLOSED
CANCELLED
COMPLETED
```

Do NOT store:

```text
AVAILABLE
ALMOST_FULL
SOLD_OUT
```

as lifecycle status.

These are computed states.

---

# STEP 16 — MEETING POINT + PACKAGE

Implement Meeting Point.

Then Schedule Package.

Example:

```text
Schedule:
19–20 September

Package:
Start Jakarta
Rp1.250.000

Package:
Start Basecamp
Rp750.000
```

Critical:

Package must NOT have:

```text
capacity
available_seats
```

---

# STEP 17 — PUBLIC API

Implement:

```text
GET /trips

GET /trips/:slug

GET /mountains

GET /mountains/:slug

GET /destinations

GET /faqs

GET /content-pages/:slug

GET /site-settings/public
```

Public API must exclude:

```text
DRAFT

sensitive booking data

participant data

admin data
```

---

# STEP 18 — PUBLIC HOMEPAGE

Build based on UX spec:

```text
Header

Hero

Upcoming Trips

Destinations

Why Wildera

How It Works

Private Trip CTA

FAQ

Final CTA

Footer
```

Mobile first.

Use real API data where available.

Avoid hard-coded trip cards.

---

# STEP 19 — TRIP CATALOG

Build:

```text
/trip
```

Implement:

```text
Search

Month Filter

Trip Type Filter

Difficulty Filter

Availability Filter

Sort nearest departure

Sort price
```

Mobile filter should use bottom sheet/drawer.

States:

```text
loading

empty

error
```

---

# STEP 20 — MOUNTAIN PUBLIC PAGES

Build:

```text
/gunung

/gunung/[slug]
```

Mountain detail:

```text
Overview

Altitude

Difficulty

Routes

Upcoming Trips
```

---

# STEP 21 — TRIP DETAIL

Build:

```text
/trip/[slug]
```

Include:

```text
Hero

Trip Summary

Schedule Selector

Package Selector

Price

Availability

Overview

Itinerary

Include

Exclude

Meeting Point

Gear

Health Requirement

Difficulty

FAQ

Policies

WhatsApp CTA
```

Desktop:

sticky booking card.

Mobile:

sticky bottom CTA.

---

# STEP 22 — WHATSAPP CONVERSION

Create centralized utility:

```text
buildBookingWhatsAppMessage()
```

Message includes:

```text
Trip

Schedule

Package

Price
```

Example:

```text
Halo Wildera Adventure 👋

Saya tertarik dengan:

Trip: Open Trip Gunung Prau
Jadwal: 19–20 September 2026
Paket: Start Jakarta
Harga: Rp1.250.000

Mohon info untuk proses booking selanjutnya.
```

Do not include sensitive information.

Implement:

```text
Trip booking WhatsApp

Health requirement WhatsApp

Global WhatsApp
```

---

# STEP 23 — BOOKING DATABASE + API

Implement:

```text
Customer

Booking
```

Booking status:

```text
INQUIRY

PENDING_CONFIRMATION

CONFIRMED

CANCELLED

COMPLETED

NO_SHOW
```

Source:

```text
WEBSITE_WHATSAPP

WHATSAPP

INSTAGRAM

ADMIN

OTHER
```

Admin-only booking creation.

No public booking endpoint.

---

# STEP 24 — CAPACITY ENGINE

This step is CRITICAL.

Implement availability:

```text
confirmed_seats
=
SUM(participant_count)
WHERE booking.status = CONFIRMED
```

```text
available_seats
=
schedule.capacity - confirmed_seats
```

Compute:

```text
AVAILABLE

ALMOST_FULL

SOLD_OUT
```

Do NOT store `available_seats`.

---

# STEP 25 — TRANSACTIONAL BOOKING CONFIRMATION

Implement:

```text
POST /admin/bookings/:id/confirm
```

Process:

```text
BEGIN

SELECT schedule FOR UPDATE

calculate confirmed seats

check requested capacity

if insufficient:
    rollback
    return 409

confirm booking

COMMIT
```

Test concurrency.

Scenario:

```text
Capacity = 20
Confirmed = 19
```

Two simultaneous confirm requests.

Expected:

```text
1 success

1 409 INSUFFICIENT_CAPACITY
```

This test MUST pass before production launch.

---

# STEP 26 — BOOKING ADMIN UI

Build:

```text
Booking List

Search

Filter

Create Booking

Booking Detail

Confirm

Cancel

Complete

No Show
```

Display:

```text
Trip

Schedule

Package

Contact

Participant Count

Status

Source
```

---

# STEP 27 — CAPACITY UPDATE RULE

When admin changes schedule capacity:

lock schedule and validate:

```text
new_capacity >= confirmed seats
```

Reject if not.

Example:

```text
capacity = 20
confirmed = 18

change to 17
```

must return:

```text
409 CAPACITY_BELOW_CONFIRMED
```

---

# STEP 28 — PARTICIPANT MANAGEMENT

Implement:

```text
BookingParticipant
```

Admin can:

```text
add

edit

remove when allowed
```

Fields may include:

```text
Full Name

Date of Birth

Gender

Phone

Identity

Emergency Contact

Notes
```

Only Full Name universally mandatory unless business rules say otherwise.

Do not create health-certificate upload.

---

# STEP 29 — PARTICIPANT MANIFEST

Schedule page must show:

```text
Trip

Schedule

Confirmed Bookings

Confirmed Participants

Participant List
```

Important:

```text
booking.participant_count
```

may be larger than current number of Participant rows.

Display:

```text
Expected: 5

Completed Data: 3
```

if applicable.

---

# STEP 30 — PRIVATE TRIP

Build public:

```text
/private-trip
```

Form:

```text
Destination

Preferred Date

Alternative Date optional

Participant Count

Meeting Point

Name

WhatsApp

Budget optional

Requirements optional
```

Implement:

```text
POST /private-trip-inquiries
```

Then admin CRM:

```text
NEW

CONTACTED

QUOTATION_SENT

NEGOTIATION

BOOKED

LOST
```

---

# STEP 31 — CMS BASIC

Implement:

```text
FAQ

About

Terms

Privacy

Cancellation

Safety
```

Admin can edit content.

Public only returns:

```text
PUBLISHED
```

content.

---

# STEP 32 — SITE SETTINGS

Implement:

```text
business_whatsapp

instagram_url

contact_email

almost_full_percentage
```

Do NOT store secrets.

Frontend reads public settings.

---

# STEP 33 — AUDIT LOG

Audit critical events:

```text
TRIP_PUBLISHED

SCHEDULE_CAPACITY_CHANGED

BOOKING_CREATED

BOOKING_CONFIRMED

BOOKING_CANCELLED

ADMIN_ROLE_CHANGED
```

Audit rows append-only.

---

# STEP 34 — SEO

Implement:

```text
Unique title

Meta description

Canonical

OpenGraph

Breadcrumb

Sitemap

robots.txt

Image alt
```

Ensure:

```text
Published Trip
```

is indexable.

Ensure:

```text
Draft Trip

Admin
```

are not indexable.

---

# STEP 35 — ANALYTICS

Track:

```text
view_home

view_trip_list

view_trip

select_schedule

select_package

click_book_whatsapp

click_health_whatsapp

private_trip_inquiry
```

Do not send:

```text
phone

email

name

identity

medical data
```

to analytics.

---

# STEP 36 — SECURITY HARDENING

Verify:

```text
HTTPS

Secure Cookies

Admin Auth

RBAC

CORS

CSRF mitigation

Rate Limiting

Input Validation

Upload Validation

Secret Management

No Sensitive Logs

Security Headers
```

---

# STEP 37 — TESTING

Create tests for critical flows.

Unit:

```text
Capacity

Booking Status

Availability

WhatsApp Message Builder
```

Integration:

```text
Authentication

Trip Publishing

Schedule

Booking

Cancellation

Private Trip
```

E2E public:

```text
Homepage
↓
Trip Catalog
↓
Trip Detail
↓
Schedule
↓
Package
↓
WhatsApp
```

E2E admin:

```text
Login
↓
Create Trip
↓
Schedule
↓
Create Booking
↓
Confirm
↓
Capacity
```

---

# STEP 38 — STAGING UAT

Run scenarios:

## Scenario 1

Admin creates real-style Trip.

## Scenario 2

Customer sees published Trip.

## Scenario 3

Customer selects Schedule + Package.

## Scenario 4

WhatsApp contextual message works.

## Scenario 5

Admin creates confirmed booking.

## Scenario 6

Capacity decreases.

## Scenario 7

Final seat cannot oversell.

## Scenario 8

Cancellation releases seat.

## Scenario 9

Private Trip lead appears in admin.

## Scenario 10

CONTENT role cannot access booking operations.

All must pass.

---

# STEP 39 — PRODUCTION PREPARATION

Configure:

```text
Production DB

Production Object Storage

Production Domain

HTTPS

Production Secrets

Automatic Backups

Error Tracking

Health Monitoring
```

Remove:

```text
test users

fake bookings

fake customer data
```

Keep required production roles/config seeds.

---

# STEP 40 — REAL BUSINESS CONTENT

Input real:

```text
Wildera logo

WhatsApp

Instagram

Contact email

Mountain data

Route data

Trip data

Schedule

Capacity

Price

Meeting Point

Itinerary

Include

Exclude

Gear

FAQ

Policies

Photography
```

Do not launch with dummy data.

---

# STEP 41 — FINAL LAUNCH CHECK

Do not launch unless:

```text
Admin Auth works

Capacity concurrency test passes

Booking works

WhatsApp works

Mobile UX works

Private Trip works

SEO works

Analytics works

Backup works

Sensitive data is protected

Legal pages exist
```

---

# STEP 42 — PRODUCTION LAUNCH

Deploy:

```text
Frontend

Backend

Migration

Seed required system config
```

Run smoke test:

```text
Homepage

Trip

WhatsApp

Admin Login

Booking

Capacity

Private Trip

Health Endpoint
```

If smoke test fails:

rollback/fix before announcing launch.

---

# STEP 43 — POST-LAUNCH

Monitor:

```text
Errors

API latency

Uptime

Trip views

WhatsApp clicks

Private Trip inquiries

Confirmed bookings

Occupancy
```

Do not immediately add features.

Collect actual data first.

---

# PHASE 2 DECISION

Only propose online checkout/payment if evidence shows:

```text
manual booking is bottleneck

WhatsApp conversion is high

payment handling becomes inefficient

customer demand exists
```

Future potential:

```text
Online Booking
↓
Seat Reservation
↓
Payment Gateway
↓
DP
↓
Pelunasan
↓
Webhook
```

Do not start this phase automatically.

---

# RESPONSE FORMAT FOR EACH STEP

Every time you work on one step, respond in this format:

```text
STEP:
STEP XX — <Name>

OBJECTIVE:
...

DEPENDENCIES:
...

FILES CREATED:
...

FILES MODIFIED:
...

IMPLEMENTATION:
...

DATABASE CHANGES:
...

API CHANGES:
...

TESTS PERFORMED:
...

TEST RESULT:
...

ACCEPTANCE CRITERIA:
[PASS/FAIL] ...

ISSUES FOUND:
...

NEXT STEP:
STEP XX — ...
```

If there is an error, fix it before proceeding whenever possible.

Do not claim a task is complete unless its acceptance criteria actually pass.

---

# FINAL INSTRUCTION

Start from:

```text
PHASE 0 — DOCUMENT VALIDATION
```

Then proceed to:

```text
STEP 1 — INITIALIZE MONOREPO
```

Do not skip directly to building the homepage.

Do not implement future-scope features.

Do not change business rules without explicitly reporting the proposed change and its effect on:

```text
PRD

UX

Architecture

Database

API

Backlog
```

The priority is:

> Build the smallest production-ready Wildera system that completes the actual business flow reliably.
