# Wildera Adventure
# API Specification

**Document:** 05_API_Specification_Wildera.md  
**Version:** 1.0  
**Status:** APPROVED FOR DEVELOPMENT  
**Related PRD:** 01_PRD_Wildera_Adventure.md v1.1  
**Related UX:** 02_UX_Specification_Wildera.md v1.0  
**Related Architecture:** 03_Technical_Architecture_Wildera.md v1.0  
**Related Database:** 04_Database_ERD_Wildera.md v1.0  
**API Style:** REST  
**Format:** JSON  
**Version:** v1  
**Last Updated:** September 2026  

---

# 1. Purpose

Dokumen ini menjadi kontrak antara:

```text
Frontend
↕
Backend API
↕
PostgreSQL
```

Frontend tidak boleh menebak struktur response.

Backend tidak boleh mengubah response contract tanpa review.

Dokumen ini mendefinisikan:

- endpoint
- request
- response
- authentication
- authorization
- pagination
- filtering
- validation
- error code
- capacity rule
- state transition
- media handling

---

# 2. API Base URL

Production:

```text
https://api.wilderaadventure.id/api/v1
```

Alternative jika menggunakan same-domain reverse proxy:

```text
https://wilderaadventure.id/api/v1
```

Final domain ditentukan saat deployment.

---

# 3. API Versioning

Current:

```text
/api/v1
```

Breaking change di masa depan menggunakan:

```text
/api/v2
```

Perubahan additive tidak selalu membutuhkan versi baru.

Contoh additive:

```text
response menambahkan field baru
```

Breaking:

```text
field dihapus
struktur response berubah
semantic endpoint berubah
```

---

# 4. Content Type

Default:

```http
Content-Type: application/json
```

Media upload:

```http
multipart/form-data
```

---

# 5. API Response Envelope

Successful single resource:

```json
{
  "success": true,
  "data": {}
}
```

Successful collection:

```json
{
  "success": true,
  "data": [],
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid.",
    "fields": {}
  },
  "requestId": "req_xxxxx"
}
```

---

# 6. HTTP Status Codes

Use consistently:

```text
200 OK
201 Created
204 No Content

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests

500 Internal Server Error
503 Service Unavailable
```

---

# 7. 400 vs 422

Use:

```text
400
```

for malformed request / bad query syntax.

Use:

```text
422
```

for valid JSON but invalid business/form data.

Example:

```text
participant_count = 0
```

returns:

```text
422 VALIDATION_ERROR
```

---

# 8. Request ID

Every API request receives:

```text
X-Request-Id
```

If client does not provide one, backend generates it.

Returned in:

```http
X-Request-Id: req_abc123
```

and error response:

```json
{
  "requestId": "req_abc123"
}
```

---

# 9. Authentication

Public endpoints:

```text
No authentication.
```

Admin endpoints:

```text
Authenticated admin session required.
```

Authentication menggunakan:

```text
Secure HttpOnly Cookie
```

---

# 10. Auth Cookie

Recommended characteristics:

```text
HttpOnly
Secure
SameSite=Lax/Strict as appropriate
Path=/
```

Frontend JavaScript tidak membaca token langsung.

---

# 11. Authorization Roles

MVP:

```text
SUPER_ADMIN
OPERATIONS
CONTENT
```

Future:

```text
FINANCE
```

---

# 12. Permission Matrix

| Resource | SUPER_ADMIN | OPERATIONS | CONTENT |
|---|---:|---:|---:|
| Dashboard | ✓ | ✓ | ✓ limited |
| Trip View | ✓ | ✓ | ✓ |
| Trip Create/Edit | ✓ | ✓ | ✓ |
| Trip Publish | ✓ | ✓ | ✓ |
| Schedule | ✓ | ✓ | Read |
| Booking | ✓ | ✓ | ✗ |
| Participants | ✓ | ✓ | ✗ |
| Private Leads | ✓ | ✓ | ✗ |
| Mountains | ✓ | ✓ | ✓ |
| FAQ/Content | ✓ | Read | ✓ |
| Settings | ✓ | Limited | Limited |
| Admin Users | ✓ | ✗ | ✗ |
| Audit Log | ✓ | Read limited | ✗ |

Backend enforces permissions.

---

# 13. Pagination Convention

Query:

```text
?page=1&pageSize=20
```

Defaults:

```text
page = 1
pageSize = 20
```

Maximum:

```text
pageSize = 100
```

Response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 124,
    "totalPages": 7
  }
}
```

---

# 14. Sorting Convention

Example:

```text
?sort=startDate&order=asc
```

Allowed:

```text
asc
desc
```

Unsupported sort field returns:

```text
400 INVALID_SORT_FIELD
```

---

# 15. Filtering Convention

Filters passed as query parameters.

Example:

```text
/api/v1/trips?month=2026-10&difficulty=MODERATE&type=OPEN_TRIP
```

Avoid complex JSON filter payload for MVP.

---

# 16. Date Format

Date:

```text
YYYY-MM-DD
```

Example:

```text
2026-10-20
```

Timestamp:

```text
ISO 8601
```

Example:

```text
2026-10-20T08:30:00+07:00
```

---

# 17. Money Format

API returns numeric amount as number:

```json
{
  "price": 950000
}
```

Frontend handles formatting:

```text
Rp950.000
```

No formatted currency string should be used as authoritative amount.

---

# 18. Phone Format

Backend stores normalized:

```text
628123456789
```

Input may accept:

```text
08123456789
+628123456789
628123456789
```

Response admin may return normalized form.

Frontend formats if necessary.

---

# 19. Public API Overview

```text
GET  /site-settings/public

GET  /trips
GET  /trips/:slug

GET  /mountains
GET  /mountains/:slug

GET  /destinations

GET  /faqs

GET  /content-pages/:slug

POST /private-trip-inquiries
```

---

# 20. Public Site Settings

Endpoint:

```http
GET /api/v1/site-settings/public
```

Purpose:

Frontend mengambil public configuration.

Response:

```json
{
  "success": true,
  "data": {
    "businessWhatsapp": "628123456789",
    "instagramUrl": "https://instagram.com/wilderaadventure.id",
    "contactEmail": "hello@example.com",
    "almostFullPercentage": 20
  }
}
```

Only whitelist public settings.

Never expose secret settings.

---

# 21. List Trips

Endpoint:

```http
GET /api/v1/trips
```

Purpose:

Trip Catalog.

---

# 22. Trip Query Parameters

Supported:

```text
search
month
type
difficulty
availability
mountain
destination
page
pageSize
sort
order
```

Example:

```text
GET /trips?month=2026-10&difficulty=MODERATE&availability=AVAILABLE
```

---

# 23. Trip Search

`search` may match:

```text
trip name
mountain name
route name
destination name
```

Example:

```text
GET /trips?search=rinjani
```

---

# 24. Trip Availability Filter

Accepted:

```text
AVAILABLE
ALMOST_FULL
SOLD_OUT
```

Availability is computed.

Not stored as trip database status.

---

# 25. Trip List Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Open Trip Gunung Prau",
      "slug": "open-trip-gunung-prau",
      "tripType": "OPEN_TRIP",
      "difficulty": "MODERATE",
      "beginnerFriendly": true,
      "duration": {
        "days": 2,
        "nights": 1
      },
      "mountain": {
        "name": "Gunung Prau",
        "slug": "prau",
        "altitudeM": 2590
      },
      "coverImage": {
        "url": "https://cdn.example.com/prau.jpg",
        "alt": "Pendakian Gunung Prau"
      },
      "nextSchedule": {
        "id": "uuid",
        "startDate": "2026-09-19",
        "endDate": "2026-09-20",
        "capacity": 20,
        "confirmedSeats": 15,
        "availableSeats": 5,
        "availabilityStatus": "AVAILABLE",
        "startingPrice": 950000
      }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 12,
    "totalPages": 1
  }
}
```

---

# 26. Trip Catalog Rule

Only return:

```text
PUBLISHED trips
```

and:

```text
deleted_at IS NULL
```

Draft and archived trips excluded unless explicitly required by public historical page behavior.

---

# 27. Get Trip Detail

Endpoint:

```http
GET /api/v1/trips/:slug
```

Example:

```http
GET /api/v1/trips/open-trip-rinjani-via-sembalun
```

---

# 28. Trip Detail Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Open Trip Gunung Rinjani",
    "slug": "open-trip-rinjani-via-sembalun",
    "tripType": "OPEN_TRIP",
    "shortDescription": "Pendakian Rinjani via Sembalun.",
    "description": "...",
    "difficulty": "HARD",
    "beginnerFriendly": false,
    "healthCertificateRequired": true,
    "duration": {
      "days": 4,
      "nights": 3
    },
    "mountain": {
      "id": "uuid",
      "name": "Gunung Rinjani",
      "slug": "rinjani",
      "altitudeM": 3726,
      "destination": {
        "name": "Lombok"
      }
    },
    "route": {
      "id": "uuid",
      "name": "Sembalun"
    },
    "media": {
      "cover": {},
      "gallery": []
    },
    "schedules": [],
    "itinerary": [],
    "includes": [],
    "excludes": [],
    "mandatoryGear": [],
    "recommendedGear": [],
    "faqs": [],
    "seo": {
      "title": "...",
      "description": "..."
    }
  }
}
```

---

# 29. Trip Schedules Response

Inside trip detail:

```json
{
  "id": "schedule_uuid",
  "startDate": "2026-10-20",
  "endDate": "2026-10-23",
  "registrationDeadline": "2026-10-18T23:59:59+07:00",
  "lifecycleStatus": "OPEN",
  "capacity": 20,
  "confirmedSeats": 16,
  "availableSeats": 4,
  "availabilityStatus": "ALMOST_FULL",
  "bookable": true,
  "packages": []
}
```

---

# 30. Availability Status

API computes:

```text
AVAILABLE
ALMOST_FULL
SOLD_OUT
CLOSED
CANCELLED
COMPLETED
```

Frontend must not calculate authoritative availability itself.

---

# 31. Bookable Field

Backend returns:

```json
{
  "bookable": true
}
```

Based on:

```text
schedule.status = OPEN
AND registration deadline valid
AND availableSeats > 0
```

Frontend uses this to control CTA.

---

# 32. Schedule Package Response

```json
{
  "id": "uuid",
  "name": "Start Jakarta",
  "description": "...",
  "price": 2500000,
  "meetingPoint": {
    "id": "uuid",
    "name": "Blok M",
    "city": "Jakarta",
    "address": "..."
  },
  "meetingDatetime": "2026-10-19T20:00:00+07:00"
}
```

Package does not expose capacity.

---

# 33. List Destinations

Endpoint:

```http
GET /api/v1/destinations
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Lombok",
      "slug": "lombok",
      "province": "Nusa Tenggara Barat"
    }
  ]
}
```

---

# 34. List Mountains

Endpoint:

```http
GET /api/v1/mountains
```

Supported query:

```text
search
destination
difficulty
page
pageSize
```

---

# 35. Mountain List Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Gunung Rinjani",
      "slug": "rinjani",
      "altitudeM": 3726,
      "defaultDifficulty": "HARD",
      "destination": {
        "name": "Lombok"
      },
      "coverImage": {
        "url": "...",
        "alt": "Gunung Rinjani"
      }
    }
  ]
}
```

---

# 36. Get Mountain Detail

Endpoint:

```http
GET /api/v1/mountains/:slug
```

Response includes:

```text
mountain
destination
routes
media
upcoming trips
SEO
```

---

# 37. Mountain Detail Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Gunung Rinjani",
    "slug": "rinjani",
    "altitudeM": 3726,
    "description": "...",
    "bestSeason": "...",
    "defaultDifficulty": "HARD",
    "destination": {},
    "routes": [],
    "media": {},
    "upcomingTrips": [],
    "seo": {}
  }
}
```

---

# 38. Global FAQ

Endpoint:

```http
GET /api/v1/faqs
```

Optional query:

```text
category
```

Example:

```text
GET /faqs?category=BOOKING
```

---

# 39. FAQ Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "category": "BOOKING",
      "question": "Bagaimana cara booking?",
      "answer": "..."
    }
  ]
}
```

---

# 40. Content Page

Endpoint:

```http
GET /api/v1/content-pages/:slug
```

Example:

```text
/terms
/privacy
/cancellation
/safety
/tentang
```

Response:

```json
{
  "success": true,
  "data": {
    "title": "Cancellation Policy",
    "slug": "cancellation",
    "content": "...",
    "updatedAt": "...",
    "seo": {}
  }
}
```

---

# 41. Create Private Trip Inquiry

Endpoint:

```http
POST /api/v1/private-trip-inquiries
```

Public endpoint.

Rate limited.

---

# 42. Private Trip Request

```json
{
  "mountainId": "uuid",
  "destinationOther": null,
  "customerName": "Adam",
  "whatsappNumber": "08123456789",
  "email": "adam@example.com",
  "preferredDate": "2026-11-01",
  "alternativeDate": "2026-11-08",
  "participantCount": 5,
  "meetingPointRequest": "Jakarta",
  "budget": 5000000,
  "requirements": "Private group"
}
```

---

# 43. Private Trip Validation

Required:

```text
customerName
whatsappNumber
preferredDate
participantCount
```

Destination:

at least one of:

```text
mountainId
destinationOther
```

Participant:

```text
participantCount >= 1
```

Budget:

```text
budget >= 0
```

if provided.

---

# 44. Private Trip Success Response

```json
{
  "success": true,
  "data": {
    "inquiryNumber": "WLD-PT-260913-F8B2",
    "status": "NEW",
    "message": "Permintaan Private Trip berhasil dikirim."
  }
}
```

Status:

```http
201 Created
```

---

# 45. Duplicate Private Submission

Exact automatic merging is not required.

Backend may record duplicate submissions.

Optional detection signal:

same WhatsApp + same preferred date + same mountain in short interval.

Admin can resolve.

Do not silently discard legitimate leads.

---

# 46. Public WhatsApp Booking

There is NO endpoint:

```text
POST /bookings
```

for customer in MVP.

Customer booking flow:

```text
Trip API
↓
Frontend Schedule Selection
↓
Frontend Package Selection
↓
WhatsApp Link
```

---

# 47. WhatsApp Message Generation

Recommended frontend utility uses:

```text
trip.name
schedule.startDate
schedule.endDate
package.name
package.price
```

Business WhatsApp number comes from:

```text
GET /site-settings/public
```

No sensitive customer data is embedded.

---

# 48. Health WhatsApp CTA

Uses same public business WhatsApp setting.

Message example:

```text
Halo Wildera Adventure,
saya ingin bertanya mengenai surat kesehatan
untuk Open Trip Gunung Rinjani.
```

No separate API required.

---

# 49. Authentication API

Admin endpoints:

```text
POST /auth/login

POST /auth/logout

GET /auth/me
```

---

# 50. Admin Login

Endpoint:

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "admin@wildera.id",
  "password": "********"
}
```

---

# 51. Login Success

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Admin Wildera",
      "email": "admin@wildera.id",
      "roles": [
        "SUPER_ADMIN"
      ]
    }
  }
}
```

Auth cookie set by response.

---

# 52. Login Error

Invalid credential:

```http
401 Unauthorized
```

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email atau password tidak valid."
  }
}
```

Do not reveal:

```text
email exists
email does not exist
```

---

# 53. Logout

```http
POST /api/v1/auth/logout
```

Response:

```http
204 No Content
```

Cookie invalidated.

---

# 54. Current Admin

```http
GET /api/v1/auth/me
```

Returns:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Admin",
    "email": "admin@...",
    "roles": [
      "OPERATIONS"
    ]
  }
}
```

---

# 55. Admin API Overview

```text
/admin/dashboard

/admin/destinations
/admin/mountains
/admin/routes

/admin/trips
/admin/schedules
/admin/meeting-points

/admin/bookings
/admin/participants

/admin/private-trip-inquiries

/admin/faqs
/admin/content-pages
/admin/media
/admin/site-settings

/admin/users
/admin/roles

/admin/audit-logs
```

---

# 56. Admin Dashboard

Endpoint:

```http
GET /api/v1/admin/dashboard
```

Permission:

```text
Authenticated admin
```

---

# 57. Dashboard Response

```json
{
  "success": true,
  "data": {
    "upcomingTrips": 8,
    "upcomingParticipants": 76,
    "recentBookings": [],
    "newPrivateTripLeads": 4,
    "almostFullSchedules": []
  }
}
```

No revenue in MVP.

---

# 58. Admin Destinations

Endpoints:

```text
GET    /admin/destinations
POST   /admin/destinations
GET    /admin/destinations/:id
PATCH  /admin/destinations/:id
DELETE /admin/destinations/:id
```

DELETE means soft delete where appropriate.

---

# 59. Create Destination

Request:

```json
{
  "name": "Lombok",
  "slug": "lombok",
  "province": "Nusa Tenggara Barat",
  "description": "...",
  "status": "ACTIVE",
  "seoTitle": "...",
  "seoDescription": "..."
}
```

---

# 60. Destination Slug Conflict

Response:

```http
409 Conflict
```

```json
{
  "success": false,
  "error": {
    "code": "SLUG_ALREADY_EXISTS",
    "message": "Slug sudah digunakan."
  }
}
```

---

# 61. Admin Mountains

Endpoints:

```text
GET    /admin/mountains
POST   /admin/mountains
GET    /admin/mountains/:id
PATCH  /admin/mountains/:id
DELETE /admin/mountains/:id
```

---

# 62. Create Mountain

```json
{
  "destinationId": "uuid",
  "name": "Gunung Rinjani",
  "slug": "rinjani",
  "altitudeM": 3726,
  "defaultDifficulty": "HARD",
  "shortDescription": "...",
  "description": "...",
  "bestSeason": "...",
  "latitude": -8.4113,
  "longitude": 116.4573,
  "status": "PUBLISHED",
  "seoTitle": "...",
  "seoDescription": "..."
}
```

---

# 63. Admin Routes

Endpoints:

```text
GET    /admin/routes
POST   /admin/routes
GET    /admin/routes/:id
PATCH  /admin/routes/:id
DELETE /admin/routes/:id
```

Filter:

```text
?mountainId=uuid
```

---

# 64. Admin Trips

Endpoints:

```text
GET   /admin/trips
POST  /admin/trips
GET   /admin/trips/:id
PATCH /admin/trips/:id

POST /admin/trips/:id/publish
POST /admin/trips/:id/archive
POST /admin/trips/:id/duplicate
```

Dedicated lifecycle action preferred over random status updates.

---

# 65. Admin Trip List

Query:

```text
search
status
type
mountainId
page
pageSize
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Open Trip Gunung Prau",
      "slug": "open-trip-gunung-prau",
      "tripType": "OPEN_TRIP",
      "status": "PUBLISHED",
      "mountain": {},
      "activeScheduleCount": 3,
      "updatedAt": "..."
    }
  ],
  "meta": {}
}
```

---

# 66. Create Trip

Endpoint:

```http
POST /api/v1/admin/trips
```

Request:

```json
{
  "mountainId": "uuid",
  "routeId": "uuid",
  "name": "Open Trip Gunung Prau",
  "slug": "open-trip-gunung-prau",
  "tripType": "OPEN_TRIP",
  "shortDescription": "...",
  "description": "...",
  "durationDays": 2,
  "durationNights": 1,
  "difficulty": "MODERATE",
  "beginnerFriendly": true,
  "healthCertificateRequired": true,
  "minimumAge": 15,
  "maximumAge": null,
  "featured": false,
  "seoTitle": "...",
  "seoDescription": "..."
}
```

Created initially as:

```text
DRAFT
```

unless explicit business rule allows direct publish.

---

# 67. Trip Nested Content

Trip content has dedicated sub-resource endpoints.

```text
/admin/trips/:tripId/itinerary
/admin/trips/:tripId/facilities
/admin/trips/:tripId/gears
/admin/trips/:tripId/faqs
/admin/trips/:tripId/media
```

This keeps payload manageable.

---

# 68. Itinerary Endpoints

```text
GET    /admin/trips/:tripId/itinerary
POST   /admin/trips/:tripId/itinerary
PATCH  /admin/trips/:tripId/itinerary/:itemId
DELETE /admin/trips/:tripId/itinerary/:itemId
```

---

# 69. Create Itinerary Item

```json
{
  "dayNumber": 1,
  "title": "Jakarta menuju Basecamp",
  "description": "...",
  "sortOrder": 1
}
```

Duplicate `dayNumber` for same trip:

```text
409 ITINERARY_DAY_EXISTS
```

---

# 70. Facilities Endpoints

```text
GET    /admin/trips/:tripId/facilities
POST   /admin/trips/:tripId/facilities
PATCH  /admin/trips/:tripId/facilities/:itemId
DELETE /admin/trips/:tripId/facilities/:itemId
```

Request:

```json
{
  "facilityType": "INCLUDE",
  "name": "Guide",
  "description": null,
  "sortOrder": 1
}
```

---

# 71. Gear Endpoints

```text
GET    /admin/trips/:tripId/gears
POST   /admin/trips/:tripId/gears
PATCH  /admin/trips/:tripId/gears/:itemId
DELETE /admin/trips/:tripId/gears/:itemId
```

Request:

```json
{
  "gearType": "MANDATORY",
  "name": "Headlamp",
  "description": "...",
  "sortOrder": 1
}
```

---

# 72. Trip FAQ Endpoints

```text
GET    /admin/trips/:tripId/faqs
POST   /admin/trips/:tripId/faqs
PATCH  /admin/trips/:tripId/faqs/:faqId
DELETE /admin/trips/:tripId/faqs/:faqId
```

---

# 73. Publish Trip

Endpoint:

```http
POST /api/v1/admin/trips/:id/publish
```

Backend validates required publish fields.

Potential requirements:

```text
name
slug
mountain
duration
difficulty
description
cover image
```

If incomplete:

```http
422
```

```json
{
  "success": false,
  "error": {
    "code": "TRIP_NOT_READY_TO_PUBLISH",
    "message": "Trip belum memenuhi syarat untuk dipublikasikan.",
    "fields": {
      "coverImage": "Cover image wajib diisi."
    }
  }
}
```

---

# 74. Duplicate Trip

```http
POST /api/v1/admin/trips/:id/duplicate
```

Copies:

```text
general content
itinerary
facilities
gears
FAQs
```

Does NOT copy:

```text
schedules
bookings
```

New trip status:

```text
DRAFT
```

---

# 75. Admin Schedules

Endpoints:

```text
GET    /admin/schedules
POST   /admin/schedules
GET    /admin/schedules/:id
PATCH  /admin/schedules/:id

POST /admin/schedules/:id/open
POST /admin/schedules/:id/close
POST /admin/schedules/:id/cancel
POST /admin/schedules/:id/complete
```

---

# 76. Schedule List

Query:

```text
tripId
status
fromDate
toDate
page
pageSize
```

Response includes capacity:

```json
{
  "id": "uuid",
  "trip": {},
  "startDate": "2026-09-19",
  "endDate": "2026-09-20",
  "lifecycleStatus": "OPEN",
  "capacity": 20,
  "confirmedSeats": 18,
  "availableSeats": 2,
  "availabilityStatus": "ALMOST_FULL"
}
```

---

# 77. Create Schedule

```json
{
  "tripId": "uuid",
  "startDate": "2026-09-19",
  "endDate": "2026-09-20",
  "registrationDeadline": "2026-09-18T18:00:00+07:00",
  "capacity": 20,
  "minimumParticipants": 8,
  "notes": null
}
```

Initial status:

```text
DRAFT
```

---

# 78. Schedule Validation

Must enforce:

```text
capacity > 0

endDate >= startDate

minimumParticipants <= capacity
```

---

# 79. Update Schedule Capacity

Endpoint:

```http
PATCH /api/v1/admin/schedules/:id
```

Request:

```json
{
  "capacity": 15
}
```

Backend locks schedule and checks confirmed seats.

If confirmed:

```text
18
```

Response:

```http
409 Conflict
```

```json
{
  "success": false,
  "error": {
    "code": "CAPACITY_BELOW_CONFIRMED",
    "message": "Capacity tidak dapat lebih kecil dari 18 peserta terkonfirmasi."
  }
}
```

---

# 80. Cancel Schedule

Endpoint:

```http
POST /api/v1/admin/schedules/:id/cancel
```

Request:

```json
{
  "reason": "Cuaca tidak memungkinkan."
}
```

Response schedule:

```text
CANCELLED
```

Existing bookings are NOT automatically deleted.

---

# 81. Meeting Point Endpoints

```text
GET    /admin/meeting-points
POST   /admin/meeting-points
PATCH  /admin/meeting-points/:id
```

---

# 82. Schedule Package Endpoints

```text
GET    /admin/schedules/:scheduleId/packages
POST   /admin/schedules/:scheduleId/packages
PATCH  /admin/schedules/:scheduleId/packages/:packageId
DELETE /admin/schedules/:scheduleId/packages/:packageId
```

---

# 83. Create Package

```json
{
  "name": "Start Jakarta",
  "description": "...",
  "price": 1250000,
  "meetingPointId": "uuid",
  "meetingDatetime": "2026-09-18T20:00:00+07:00",
  "status": "ACTIVE",
  "sortOrder": 1
}
```

---

# 84. Package Capacity

API MUST NOT accept:

```json
{
  "capacity": 10
}
```

Package has no capacity field.

Capacity belongs to schedule.

---

# 85. Admin Booking Endpoints

```text
GET   /admin/bookings
POST  /admin/bookings
GET   /admin/bookings/:id
PATCH /admin/bookings/:id

POST /admin/bookings/:id/confirm
POST /admin/bookings/:id/cancel
POST /admin/bookings/:id/complete
POST /admin/bookings/:id/no-show
```

---

# 86. Booking List

Filters:

```text
search
scheduleId
tripId
status
source
fromDate
toDate
page
pageSize
```

Search can match:

```text
booking number
contact name
WhatsApp
```

---

# 87. Create Booking

Endpoint:

```http
POST /api/v1/admin/bookings
```

Request:

```json
{
  "scheduleId": "uuid",
  "packageId": "uuid",
  "participantCount": 2,
  "contactName": "Adam",
  "contactWhatsapp": "08123456789",
  "contactEmail": null,
  "source": "WEBSITE_WHATSAPP",
  "status": "PENDING_CONFIRMATION",
  "notes": null
}
```

---

# 88. Create Confirmed Booking

Admin may create directly as:

```text
CONFIRMED
```

Request:

```json
{
  "scheduleId": "uuid",
  "packageId": "uuid",
  "participantCount": 2,
  "contactName": "Adam",
  "contactWhatsapp": "08123456789",
  "source": "WHATSAPP",
  "status": "CONFIRMED"
}
```

If `CONFIRMED`, capacity validation occurs transactionally.

---

# 89. Booking Creation Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "bookingNumber": "WLD-260913-A7K4",
    "status": "CONFIRMED",
    "participantCount": 2,
    "schedule": {},
    "package": {},
    "customer": {},
    "createdAt": "..."
  }
}
```

---

# 90. Package/Schedule Integrity

If:

```text
package.scheduleId != request.scheduleId
```

return:

```http
422
```

```json
{
  "success": false,
  "error": {
    "code": "PACKAGE_SCHEDULE_MISMATCH",
    "message": "Package tidak tersedia pada schedule tersebut."
  }
}
```

---

# 91. Booking Capacity Error

If available:

```text
1
```

and requested:

```text
2
```

return:

```http
409 Conflict
```

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CAPACITY",
    "message": "Schedule hanya memiliki 1 seat tersisa.",
    "details": {
      "requestedSeats": 2,
      "availableSeats": 1
    }
  }
}
```

---

# 92. Get Booking Detail

```http
GET /api/v1/admin/bookings/:id
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "bookingNumber": "WLD-260913-A7K4",
    "status": "CONFIRMED",
    "source": "WEBSITE_WHATSAPP",
    "participantCount": 2,
    "contact": {
      "name": "Adam",
      "whatsapp": "628...",
      "email": null
    },
    "trip": {},
    "schedule": {},
    "package": {},
    "participants": [],
    "notes": null,
    "timeline": {
      "createdAt": "...",
      "confirmedAt": "..."
    }
  }
}
```

---

# 93. Update Booking

Generic editable fields:

```text
contactName
contactWhatsapp
contactEmail
packageId
participantCount
notes
```

Do not allow arbitrary status via generic PATCH.

Status transitions use dedicated actions.

---

# 94. Update Confirmed Participant Count

If booking is:

```text
CONFIRMED
```

and participant count increases:

backend must lock schedule and validate capacity.

Example:

```text
2 → 4
```

requires 2 additional seats.

---

# 95. Confirm Booking

Endpoint:

```http
POST /api/v1/admin/bookings/:id/confirm
```

Valid from:

```text
INQUIRY
PENDING_CONFIRMATION
```

Backend:

```text
begin transaction
lock schedule
calculate capacity
validate
update booking
commit
```

---

# 96. Confirm Response

```json
{
  "success": true,
  "data": {
    "bookingNumber": "WLD-...",
    "status": "CONFIRMED",
    "scheduleAvailability": {
      "capacity": 20,
      "confirmedSeats": 20,
      "availableSeats": 0,
      "availabilityStatus": "SOLD_OUT"
    }
  }
}
```

---

# 97. Cancel Booking

Endpoint:

```http
POST /api/v1/admin/bookings/:id/cancel
```

Request:

```json
{
  "reason": "Customer membatalkan perjalanan."
}
```

Valid from:

```text
INQUIRY
PENDING_CONFIRMATION
CONFIRMED
```

---

# 98. Cancellation Response

```json
{
  "success": true,
  "data": {
    "bookingNumber": "WLD-...",
    "status": "CANCELLED",
    "cancelledAt": "...",
    "scheduleAvailability": {
      "capacity": 20,
      "confirmedSeats": 18,
      "availableSeats": 2
    }
  }
}
```

No manual seat increment.

---

# 99. Complete Booking

```http
POST /api/v1/admin/bookings/:id/complete
```

Allowed from:

```text
CONFIRMED
```

This represents trip completion.

---

# 100. No Show

```http
POST /api/v1/admin/bookings/:id/no-show
```

Allowed from:

```text
CONFIRMED
```

---

# 101. Participant Endpoints

```text
GET    /admin/bookings/:bookingId/participants
POST   /admin/bookings/:bookingId/participants
PATCH  /admin/bookings/:bookingId/participants/:participantId
DELETE /admin/bookings/:bookingId/participants/:participantId
```

---

# 102. Create Participant

```json
{
  "fullName": "Budi",
  "dateOfBirth": "1999-01-01",
  "gender": "MALE",
  "phone": "081234...",
  "identityType": "KTP",
  "identityNumber": "...",
  "emergencyContactName": "...",
  "emergencyContactPhone": "...",
  "notes": null
}
```

Only `fullName` universally mandatory.

Other required fields may be configured/business-driven later.

---

# 103. Participant Row Count

API must not assume:

```text
number of participant records == booking.participantCount
```

Admin UI may display:

```text
Expected: 5
Data completed: 3
```

---

# 104. Schedule Participant Manifest

Endpoint:

```http
GET /api/v1/admin/schedules/:scheduleId/participants
```

Purpose:

Operations manifest.

---

# 105. Participant Manifest Response

```json
{
  "success": true,
  "data": {
    "schedule": {
      "id": "uuid",
      "tripName": "Open Trip Prau",
      "startDate": "2026-09-19"
    },
    "summary": {
      "confirmedBookings": 8,
      "confirmedParticipants": 18
    },
    "participants": []
  }
}
```

Only confirmed booking participants included by default.

---

# 106. Private Trip Admin Endpoints

```text
GET   /admin/private-trip-inquiries
GET   /admin/private-trip-inquiries/:id
PATCH /admin/private-trip-inquiries/:id

POST /admin/private-trip-inquiries/:id/mark-contacted
POST /admin/private-trip-inquiries/:id/mark-quotation
POST /admin/private-trip-inquiries/:id/mark-negotiation
POST /admin/private-trip-inquiries/:id/mark-booked
POST /admin/private-trip-inquiries/:id/mark-lost
```

---

# 107. Private Trip List Filters

```text
search
status
assignedAdminId
fromDate
toDate
page
pageSize
```

Search matches:

```text
inquiry number
customer name
WhatsApp
destination
```

---

# 108. Assign Private Lead

Generic PATCH:

```json
{
  "assignedAdminId": "uuid",
  "adminNotes": "Follow up besok."
}
```

---

# 109. Private Status Transition

Example:

```http
POST /admin/private-trip-inquiries/:id/mark-contacted
```

returns status:

```text
CONTACTED
```

Invalid state:

```http
409 INVALID_STATUS_TRANSITION
```

---

# 110. Mark Private Trip Booked

When Private Trip becomes actual customer booking:

```text
Private Inquiry
↓
BOOKED
```

MVP may create a booking separately if tied to an actual schedule/product.

Do not automatically fabricate a schedule unless operations requires one.

Private-trip operational conversion can be refined later.

---

# 111. Admin FAQ API

Global FAQs:

```text
GET    /admin/faqs
POST   /admin/faqs
PATCH  /admin/faqs/:id
DELETE /admin/faqs/:id
```

---

# 112. Content Page API

```text
GET   /admin/content-pages
GET   /admin/content-pages/:id
POST  /admin/content-pages
PATCH /admin/content-pages/:id

POST /admin/content-pages/:id/publish
POST /admin/content-pages/:id/archive
```

---

# 113. Site Settings Admin

```text
GET   /admin/site-settings
PATCH /admin/site-settings/:key
```

Only supported keys may be modified.

Do not create arbitrary secrets.

---

# 114. Public Setting Keys

Possible:

```text
business_whatsapp
instagram_url
contact_email
almost_full_percentage
```

---

# 115. Update WhatsApp Number

Example:

```http
PATCH /api/v1/admin/site-settings/business_whatsapp
```

Request:

```json
{
  "value": "628123456789"
}
```

Permission:

```text
SUPER_ADMIN
```

or explicitly permitted Operations role.

---

# 116. Media API

MVP simple flow:

```text
POST /admin/media
DELETE /admin/media/:id
```

Upload:

```http
multipart/form-data
```

---

# 117. Upload Media Fields

```text
file
altText
```

Backend validates:

```text
MIME
file size
extension
image dimensions where applicable
```

---

# 118. Media Upload Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://cdn...",
    "mimeType": "image/webp",
    "width": 1600,
    "height": 1067,
    "altText": "Gunung Rinjani"
  }
}
```

---

# 119. Attach Trip Media

Endpoint:

```http
POST /admin/trips/:tripId/media
```

Request:

```json
{
  "mediaId": "uuid",
  "mediaRole": "COVER",
  "sortOrder": 0
}
```

---

# 120. Admin Users

Super Admin only.

```text
GET   /admin/users
POST  /admin/users
GET   /admin/users/:id
PATCH /admin/users/:id

POST /admin/users/:id/disable
POST /admin/users/:id/enable
```

No public registration.

---

# 121. Create Admin

```json
{
  "name": "Operations Wildera",
  "email": "ops@wildera.id",
  "password": "temporary password",
  "roles": [
    "OPERATIONS"
  ]
}
```

Password handling policy should ideally require change/reset workflow later.

---

# 122. Admin Role Update

Endpoint:

```http
PATCH /admin/users/:id
```

Example:

```json
{
  "roles": [
    "OPERATIONS",
    "CONTENT"
  ]
}
```

Must generate audit log.

---

# 123. Audit Logs

Endpoint:

```http
GET /api/v1/admin/audit-logs
```

Permission:

```text
SUPER_ADMIN
```

or limited operations read if desired.

Filters:

```text
adminUserId
entityType
entityId
action
fromDate
toDate
page
pageSize
```

---

# 124. Audit Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "admin": {
        "id": "uuid",
        "name": "Adam"
      },
      "action": "BOOKING_CONFIRMED",
      "entityType": "booking",
      "entityId": "uuid",
      "createdAt": "..."
    }
  ],
  "meta": {}
}
```

Sensitive old/new values can be restricted.

---

# 125. Health Endpoint

Outside versioned business API:

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "database": "ok",
  "timestamp": "..."
}
```

Do not expose infrastructure secrets.

---

# 126. Error Code Catalog

Authentication:

```text
INVALID_CREDENTIALS
UNAUTHENTICATED
FORBIDDEN
ADMIN_DISABLED
```

Validation:

```text
VALIDATION_ERROR
INVALID_DATE_RANGE
INVALID_PHONE_NUMBER
INVALID_STATUS_TRANSITION
```

Trip:

```text
TRIP_NOT_FOUND
TRIP_NOT_READY_TO_PUBLISH
SLUG_ALREADY_EXISTS
```

Schedule:

```text
SCHEDULE_NOT_FOUND
SCHEDULE_NOT_OPEN
SCHEDULE_CLOSED
SCHEDULE_CANCELLED
REGISTRATION_CLOSED
CAPACITY_BELOW_CONFIRMED
```

Booking:

```text
BOOKING_NOT_FOUND
INSUFFICIENT_CAPACITY
PACKAGE_SCHEDULE_MISMATCH
INVALID_BOOKING_STATUS
```

Private Trip:

```text
PRIVATE_TRIP_NOT_FOUND
PRIVATE_TRIP_SUBMISSION_FAILED
```

Media:

```text
INVALID_FILE_TYPE
FILE_TOO_LARGE
MEDIA_NOT_FOUND
```

Generic:

```text
RESOURCE_NOT_FOUND
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
SERVICE_UNAVAILABLE
```

---

# 127. Validation Error Format

Example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Beberapa data belum valid.",
    "fields": {
      "whatsappNumber": "Masukkan nomor WhatsApp yang valid.",
      "participantCount": "Jumlah peserta minimal 1."
    }
  }
}
```

---

# 128. Not Found

```http
404
```

```json
{
  "success": false,
  "error": {
    "code": "TRIP_NOT_FOUND",
    "message": "Trip tidak ditemukan."
  }
}
```

---

# 129. Rate Limit Error

```http
429
```

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Terlalu banyak permintaan. Silakan coba kembali."
  }
}
```

---

# 130. Internal Error

Never return raw stack trace.

Response:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Terjadi kendala pada sistem."
  },
  "requestId": "req_xxx"
}
```

Full error only in server logs.

---

# 131. State Transition Rule

Frontend should not decide status validity.

Backend controls transitions.

Booking:

```text
INQUIRY
→ PENDING_CONFIRMATION
→ CONFIRMED
→ COMPLETED
```

Alternative:

```text
INQUIRY
→ CONFIRMED
```

Cancellation:

```text
INQUIRY
PENDING_CONFIRMATION
CONFIRMED
→ CANCELLED
```

---

# 132. Capacity Transaction API Rule

All operations that can increase confirmed occupancy must use a transaction:

```text
Create CONFIRMED Booking

Confirm Booking

Increase participant_count on CONFIRMED Booking

Reduce schedule capacity
```

---

# 133. Concurrency Response

If two admins confirm final seat simultaneously:

one succeeds.

Other receives:

```http
409
```

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CAPACITY",
    "message": "Seat sudah tidak mencukupi."
  }
}
```

Frontend must refresh capacity after this error.

---

# 134. Optimistic Frontend Data

Frontend may display previously fetched:

```text
Available: 2
```

but backend may return:

```text
INSUFFICIENT_CAPACITY
```

if another admin confirmed first.

Backend always wins.

---

# 135. API Cache Rules

Safe public resources:

```text
mountains
trip static content
FAQs
content pages
```

may be cached.

Do not heavily cache:

```text
schedule availability
admin booking data
```

without explicit invalidation strategy.

---

# 136. Public Availability Freshness

Trip detail schedule availability should be revalidated frequently.

Because booking happens manually, displayed availability is:

> Current system-recorded capacity, not a guaranteed reservation.

Frontend copy must avoid implying seat is locked.

---

# 137. Idempotency

MVP recommendation:

Support optional header for critical create action:

```http
Idempotency-Key: <unique-value>
```

Most useful for:

```text
POST /private-trip-inquiries
POST /admin/bookings
```

This can prevent accidental duplicate submission/retry.

If not implemented initially, frontend must at minimum disable repeated submit during request.

---

# 138. API Security

All input validated server-side.

Admin endpoints require:

```text
authentication
authorization
origin protection
rate limiting where necessary
```

Public write endpoints require:

```text
validation
rate limiting
spam protection
```

---

# 139. Sensitive Data Response Rules

Public API must never return:

```text
customer names
customer WhatsApp
participant identity
emergency contacts
audit logs
admin details
```

unless explicitly public-safe.

---

# 140. Analytics and API

Analytics events are mainly frontend responsibility.

Backend should not block business action because analytics fails.

Important rule:

```text
WhatsApp redirect > analytics tracking
```

---

# 141. No Payment API MVP

Explicitly NOT ACTIVE:

```text
POST /payments
POST /checkout
POST /payment-webhooks
GET /payments
```

These belong to future Phase 2.

Do not implement placeholders that create false complexity.

---

# 142. No Customer Auth MVP

Explicitly NOT ACTIVE:

```text
/customer/register
/customer/login
/customer/profile
/customer/bookings
```

Customer does not have account in MVP.

---

# 143. No Public Booking Endpoint

Explicitly NOT ACTIVE:

```text
POST /bookings
```

for public customer.

Admin-only booking management.

This is intentional.

---

# 144. Endpoint Summary — Public

```text
GET  /site-settings/public

GET  /destinations

GET  /mountains
GET  /mountains/:slug

GET  /trips
GET  /trips/:slug

GET  /faqs

GET  /content-pages/:slug

POST /private-trip-inquiries
```

---

# 145. Endpoint Summary — Authentication

```text
POST /auth/login
POST /auth/logout
GET  /auth/me
```

---

# 146. Endpoint Summary — Admin Catalog

```text
/admin/destinations
/admin/mountains
/admin/routes

/admin/trips
/admin/trips/:id/itinerary
/admin/trips/:id/facilities
/admin/trips/:id/gears
/admin/trips/:id/faqs
/admin/trips/:id/media

/admin/schedules
/admin/schedules/:id/packages

/admin/meeting-points
```

---

# 147. Endpoint Summary — Admin Operations

```text
/admin/bookings

/admin/bookings/:id/confirm
/admin/bookings/:id/cancel
/admin/bookings/:id/complete
/admin/bookings/:id/no-show

/admin/bookings/:id/participants

/admin/schedules/:id/participants

/admin/private-trip-inquiries
```

---

# 148. Endpoint Summary — Admin CMS

```text
/admin/faqs

/admin/content-pages

/admin/media

/admin/site-settings
```

---

# 149. Endpoint Summary — Admin Security

```text
/admin/users

/admin/roles

/admin/audit-logs
```

---

# 150. Example End-to-End Public Flow

Frontend:

```text
GET /trips
```

User selects Rinjani.

```text
GET /trips/open-trip-rinjani
```

Backend returns:

```text
schedule
availability
packages
```

User selects:

```text
20–23 October

Start Jakarta
```

Frontend builds:

```text
WhatsApp message
```

and opens business WhatsApp.

No booking record exists yet.

---

# 151. Example End-to-End Admin Booking Flow

Customer confirms through WhatsApp.

Admin:

```text
POST /admin/bookings
```

with:

```text
PENDING_CONFIRMATION
```

Admin finalizes:

```text
POST /admin/bookings/:id/confirm
```

Backend:

```text
locks schedule

checks confirmed occupancy

confirms booking

returns latest availability
```

---

# 152. Example Final-Seat Scenario

Initial:

```text
capacity: 20
confirmed: 19
available: 1
```

Admin A requests:

```text
confirm booking 1 seat
```

Success.

New:

```text
20 / 20
```

Admin B requests simultaneously.

Backend after lock:

```text
confirmed = 20
available = 0
```

Response:

```text
409 INSUFFICIENT_CAPACITY
```

No overselling.

---

# 153. Frontend Error Handling Contract

For:

```text
401
```

Admin frontend redirects to login if session invalid.

For:

```text
403
```

show access denied.

For:

```text
409
```

show business conflict and refresh relevant data.

For:

```text
422
```

show inline field errors.

For:

```text
500
```

show generic retry state.

---

# 154. API Naming Rules

Use plural resource names:

```text
/trips
/bookings
/mountains
```

Avoid verbs in standard CRUD endpoints.

Good:

```text
POST /bookings
```

Lifecycle action can use verbs:

```text
POST /bookings/:id/confirm
```

because this is domain action, not simple CRUD.

---

# 155. Boolean Naming

Use positive boolean:

```text
beginnerFriendly
healthCertificateRequired
bookable
featured
```

Avoid:

```text
notBeginner
disableHealthCertificate
```

---

# 156. Null Handling

Use:

```json
null
```

for truly unavailable optional field.

Avoid inconsistent:

```text
""
"N/A"
"-"
```

API returns data, frontend decides display fallback.

---

# 157. Empty Arrays

Collections use:

```json
[]
```

not:

```json
null
```

Example:

```json
{
  "gallery": [],
  "faqs": []
}
```

---

# 158. Backward Compatibility

Frontend should tolerate additional response fields.

Backend should not:

- rename existing field
- change enum semantic
- change data type

without version/change review.

---

# 159. API Test Requirements

Every critical endpoint needs:

```text
success test
validation test
unauthorized test
forbidden test
not found test
business conflict test
```

---

# 160. Critical Integration Tests

Mandatory:

### Trip

Published trip visible.

Draft trip hidden.

### Schedule

Capacity calculated correctly.

### Booking

Confirmed booking consumes capacity.

Cancellation releases capacity.

### Concurrency

Two confirmations cannot oversell.

### Private Trip

Valid inquiry created.

Invalid input rejected.

### Auth

Disabled admin cannot login.

### RBAC

CONTENT cannot confirm booking.

---

# 161. API Definition of Done

API MVP is considered complete when:

1. Public trip catalog works.
2. Public trip detail returns schedule availability.
3. Package data is tied to schedule.
4. Mountain APIs work.
5. Private Trip submission works.
6. Public settings expose WhatsApp safely.
7. Admin auth works.
8. RBAC works.
9. Trip CRUD works.
10. Schedule CRUD works.
11. Package CRUD works.
12. Booking CRUD works.
13. Booking confirm is transactional.
14. Capacity conflict returns 409.
15. Confirmed quantity changes are capacity-safe.
16. Cancellation releases capacity through computed model.
17. Participant management works.
18. Private Trip lead management works.
19. CMS endpoints work.
20. Media uploads are validated.
21. Audit logs are generated.
22. API errors follow standard envelope.
23. Pagination is consistent.
24. Public API never exposes sensitive data.
25. Payment endpoints are absent from active MVP.

---

# 162. API Architecture Decision

The core contract is:

```text
PUBLIC WEBSITE
↓
READ TRIPS / SCHEDULES / PACKAGES
↓
WHATSAPP
```

and:

```text
ADMIN
↓
CREATE BOOKING
↓
CONFIRM BOOKING
↓
CAPACITY VALIDATION
↓
POSTGRESQL
```

The API deliberately does not create a fake online booking/checkout workflow before Wildera actually needs one.

---

# 163. Next Document

Next:

```text
06_Development_Backlog_Wildera.md
```

Dokumen terakhir akan mengubah:

```text
PRD
+
UX
+
Architecture
+
Database
+
API
```

menjadi pekerjaan implementasi:

```text
EPIC
↓
FEATURE
↓
USER STORY
↓
FE TASK
↓
BE TASK
↓
DB TASK
↓
QA TASK
↓
ACCEPTANCE CRITERIA
```

Backlog juga akan menentukan:

```text
P0 / P1 / P2

dependency

development sequence

Sprint 0

Sprint 1

Sprint 2

Sprint 3

Sprint 4

launch checklist
```

sehingga project dapat langsung masuk development.