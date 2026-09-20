# Wildera Adventure
# Product Requirements Document

**Document:** 01_PRD_Wildera_Adventure.md  
**Version:** 1.1  
**Status:** APPROVED FOR DEVELOPMENT
**Product:** Wildera Adventure Website  
**Owner:** Wildera Adventure  
**Last Updated:** September 2026  

---

# 1. Executive Summary

Wildera Adventure adalah usaha jasa perjalanan pendakian gunung di Indonesia dengan layanan utama:

- Open Trip
- Private Trip
- Custom Trip

Website Wildera Adventure akan menjadi platform utama untuk:

1. Menampilkan Open Trip yang tersedia.
2. Menampilkan jadwal, harga, itinerary, fasilitas, meeting point, dan requirement trip.
3. Membantu calon customer memilih trip.
4. Mengarahkan calon customer melakukan booking melalui WhatsApp.
5. Mengumpulkan inquiry Private Trip.
6. Membantu admin mengelola trip, schedule, booking, participant, dan capacity.
7. Mendukung SEO dan organic traffic.
8. Mengurangi pertanyaan berulang melalui Instagram dan WhatsApp.

Website MVP **belum melakukan transaksi pembayaran secara online**.

Flow transaksi utama:

```text
Discovery
↓
Trip Detail
↓
Choose Schedule
↓
WhatsApp Wildera
↓
Admin Confirmation
↓
Manual Booking
↓
Trip Preparation
↓
Trip
```

Website diposisikan sebagai:

> **Trip Discovery + Lead Generation + Booking Management + Operational Platform.**

---

# 2. Product Vision

Membuat Wildera Adventure menjadi platform perjalanan pendakian yang informatif, terpercaya, mudah digunakan, dan mempermudah calon pendaki menemukan serta memesan trip gunung di Indonesia.

Target pengalaman:

```text
Discover
↓
Understand
↓
Trust
↓
Contact
↓
Book
↓
Prepare
↓
Adventure
```

---

# 3. Product Principles

## 3.1 Conversion First

Tujuan utama website bukan hanya mendapatkan traffic.

Target:

```text
Visitor
↓
Trip Detail
↓
WhatsApp Inquiry
↓
Booking
```

---

## 3.2 Mobile First

Website diprioritaskan untuk mobile karena traffic diperkirakan berasal dari:

- Instagram
- WhatsApp
- Google
- Social media

---

## 3.3 Trust Before Contact

Sebelum customer menghubungi Wildera, website harus menjawab sebagian besar pertanyaan dasar:

- jadwal
- harga
- itinerary
- meeting point
- difficulty
- include
- exclude
- gear
- requirement
- trip policy

---

## 3.4 Transparent Information

Harga dan fasilitas harus jelas.

Hindari:

- hidden cost
- pricing ambigu
- CTA tanpa informasi trip yang cukup

---

## 3.5 WhatsApp as Conversion Channel

Untuk MVP:

> WhatsApp merupakan channel booking utama.

Website harus mengurangi friction sebelum customer berpindah ke WhatsApp.

---

## 3.6 Operational Efficiency

Semua booking yang sudah dikonfirmasi melalui:

- WhatsApp
- Instagram
- channel lain

harus dicatat ke admin system agar capacity tetap terpusat.

---

## 3.7 Avoid Overengineering

MVP belum membutuhkan:

- payment gateway
- customer account
- automated checkout
- temporary seat reservation
- loyalty
- referral
- marketplace

---

# 4. Background

Acquisition Wildera saat ini sangat bergantung pada social media.

Calon customer membutuhkan tempat terpusat untuk mendapatkan informasi:

- gunung
- schedule
- harga
- itinerary
- fasilitas
- requirement
- cara booking

Tanpa website, customer harus menanyakan informasi tersebut satu per satu melalui chat.

---

# 5. Problem Statement

## Customer Problem

Customer sulit memperoleh seluruh informasi trip dalam satu tempat.

## Business Problem

Admin harus menjawab pertanyaan yang sama berulang kali.

## Operational Problem

Booking dari berbagai channel berpotensi tidak mempunyai inventory/capacity yang terpusat.

## Marketing Problem

Traffic dari Instagram hanya menghasilkan:

```text
Instagram
↓
DM
```

Target:

```text
Instagram
↓
Website Trip Detail
↓
WhatsApp
↓
Booking
```

---

# 6. Business Goals

### BG-01

Meningkatkan jumlah Open Trip inquiry.

### BG-02

Meningkatkan conversion inquiry menjadi booking.

### BG-03

Meningkatkan Private Trip leads.

### BG-04

Mengurangi repetitive customer questions.

### BG-05

Membangun centralized booking database.

### BG-06

Meningkatkan operational efficiency.

### BG-07

Membangun organic traffic dari Google.

### BG-08

Meningkatkan customer trust terhadap Wildera Adventure.

---

# 7. Product Goals

Customer harus dapat:

- menemukan trip
- melihat schedule
- melihat harga
- melihat available capacity
- memahami itinerary
- memahami difficulty
- memahami requirement
- menghubungi admin dengan konteks trip yang sudah terisi

Admin harus dapat:

- membuat trip
- membuat schedule
- mengatur capacity
- mencatat booking
- mencatat participant
- melihat available seat
- mengelola Private Trip inquiry

---

# 8. MVP Scope

P0:

1. Homepage
2. Trip Catalog
3. Mountain / Destination
4. Trip Detail
5. Open Trip Schedule
6. Package Information
7. Capacity / Seat Availability
8. WhatsApp Booking CTA
9. Private Trip
10. Admin Login
11. Admin Dashboard
12. Trip Management
13. Schedule Management
14. Manual Booking Management
15. Participant Management
16. Private Trip Lead Management
17. Basic Content Management
18. Basic SEO
19. Analytics
20. FAQ
21. Legal Pages
22. Health / Trip Requirement Information

---

# 9. Features Removed from MVP

Feature berikut **tidak dibangun sebagai active feature di MVP**:

- online checkout
- payment gateway
- online payment
- virtual account
- QRIS integration
- payment webhook
- DP automation
- pelunasan automation
- payment expiry
- temporary seat reservation countdown

Requirement dapat tetap didokumentasikan sebagai draft untuk pengembangan berikutnya.

---

# 10. Future / Draft Scope

## Payment Module

Future system dapat mendukung:

- full payment
- DP
- pelunasan
- payment gateway
- Virtual Account
- QRIS
- payment status
- payment deadline
- webhook
- refund

Tetapi:

> Payment feature tidak menjadi dependency launch MVP.

---

# 11. Non-Goals MVP

MVP bukan:

- marketplace
- OTA
- rental marketplace
- e-commerce
- community app
- social platform

Tidak termasuk:

- customer login
- loyalty
- referral
- merchandise
- gear rental
- dynamic pricing
- AI recommendation
- affiliate
- advanced CRM
- automated payment

---

# 12. Target Users

## Beginner Hiker

Membutuhkan:

- difficulty
- safety information
- equipment checklist
- itinerary
- requirement
- guide information

---

## Solo Traveler

Membutuhkan:

- Open Trip
- schedule
- meeting point
- price
- available seat

---

## Experienced Hiker

Membutuhkan akses cepat ke:

- mountain
- route
- schedule
- price
- availability

---

## Group Traveler

Lebih relevan dengan:

- Private Trip
- custom schedule
- custom meeting point

---

## Corporate / Organization

Membutuhkan:

- custom trip
- quotation
- coordination
- custom requirement

---

# 13. Jobs To Be Done

## JTBD-01

Ketika saya ingin naik gunung, saya ingin melihat jadwal Open Trip yang tersedia.

## JTBD-02

Ketika saya menemukan trip, saya ingin melihat detail lengkapnya sebelum bertanya kepada admin.

## JTBD-03

Ketika saya tertarik mengikuti trip, saya ingin menghubungi Wildera dengan mudah.

## JTBD-04

Ketika saya ingin membawa grup sendiri, saya ingin mengajukan Private Trip.

## JTBD-05

Sebagai admin, saya ingin semua booking tercatat agar capacity trip tidak melebihi batas.

---

# 14. Open Trip User Journey

```text
Instagram / Google
↓
Wildera Website
↓
Explore Trip
↓
Trip Detail
↓
Select Schedule
↓
Select Package / Meeting Point
↓
View Availability
↓
Book via WhatsApp
↓
WhatsApp Opens with Prefilled Message
↓
Admin Handles Inquiry
↓
Admin Confirms Availability
↓
Admin Creates Booking
↓
Booking Confirmed
```

---

# 15. WhatsApp Booking Flow

Trip Detail menyediakan CTA:

> **Book via WhatsApp**

Ketika customer menekan CTA, website membuka WhatsApp dengan contextual message.

Contoh:

```text
Halo Wildera Adventure,

Saya tertarik mengikuti:

Open Trip Gunung Rinjani
Tanggal: 10–13 Oktober 2026
Package: Start Jakarta
Jumlah peserta: 2

Mohon info untuk proses booking selanjutnya.
```

Customer tidak perlu kembali menjelaskan trip yang dimaksud.

---

# 16. WhatsApp CTA Business Rules

## WA-01

Trip name harus otomatis ikut dalam message.

## WA-02

Schedule yang dipilih harus ikut.

## WA-03

Package jika dipilih harus ikut.

## WA-04

Jumlah participant dapat ikut jika tersedia selector.

## WA-05

WhatsApp number harus dapat dikelola dari admin/configuration.

## WA-06

CTA tetap dapat digunakan jika schedule hampir penuh.

## WA-07

Jika schedule SOLD OUT, CTA Book harus tidak aktif atau berubah menjadi Contact Admin / Waitlist Inquiry sesuai keputusan berikutnya.

---

# 17. Homepage

Homepage minimal memiliki:

## Hero

- headline
- value proposition
- Explore Trip
- Private Trip

## Upcoming Trips

Menampilkan:

- mountain
- departure date
- duration
- difficulty
- starting price
- remaining seat

## Popular Destination

## Why Wildera

## How It Works

```text
Choose
↓
Contact
↓
Confirm
↓
Prepare
↓
Adventure
```

## Private Trip CTA

## Documentation / Testimonial

## FAQ

## Final CTA

---

# 18. Trip Catalog

User dapat melihat seluruh published trip.

Minimum filter:

- month
- trip type
- difficulty
- availability

Search:

- mountain
- trip
- location

Sort:

- nearest departure
- lowest price

---

# 19. Trip Card

Minimal menampilkan:

- image
- trip name
- mountain
- nearest schedule
- duration
- difficulty
- starting price
- available seat

CTA:

> View Trip

---

# 20. Mountain Page

Setiap gunung mempunyai landing page.

Informasi:

- mountain name
- location
- altitude
- description
- difficulty
- route
- upcoming trip

Tujuan:

- SEO
- education
- trip discovery

---

# 21. Trip Detail

Trip Detail merupakan conversion page terpenting.

Harus mempunyai:

- trip name
- mountain
- route
- altitude
- duration
- difficulty
- beginner friendly
- photos
- available schedules
- prices/packages
- capacity
- itinerary
- include
- exclude
- meeting point
- gear
- health requirement
- FAQ
- policy
- WhatsApp booking CTA

---

# 22. Trip Schedule

Trip dapat memiliki banyak schedule.

Contoh:

```text
Open Trip Prau
├── 12–13 September
├── 19–20 September
└── 26–27 September
```

---

# 23. Capacity Model

Capacity dihitung:

> **PER SCHEDULE**

Bukan per package.

Contoh:

```text
Schedule:
19–20 September

Capacity:
20

Confirmed:
15

Available:
5
```

Package Start Jakarta dan Start Basecamp menggunakan inventory yang sama.

---

# 24. Capacity Business Rules

## CAP-01

Setiap schedule wajib memiliki capacity.

## CAP-02

Confirmed participant tidak boleh melebihi schedule capacity.

## CAP-03

Available capacity:

```text
Capacity
-
Confirmed Participants
=
Available Seats
```

## CAP-04

Package tidak mempunyai independent seat capacity.

## CAP-05

Admin harus melihat availability sebelum melakukan manual booking.

## CAP-06

Booking yang dikonfirmasi harus langsung mengurangi available seat.

## CAP-07

Cancelled booking dapat mengembalikan seat sesuai status booking.

---

# 25. Schedule Status

Status:

```text
DRAFT

AVAILABLE

ALMOST_FULL

SOLD_OUT

CLOSED

CANCELLED

COMPLETED
```

---

# 26. Almost Full

**[ASSUMPTION APPROVED]**

Sistem dapat menampilkan status `ALMOST_FULL`.

Exact threshold dapat ditentukan dalam UX/technical specification.

Contoh:

```text
≤ 20% capacity remaining
```

---

# 27. Trip Package

Schedule dapat memiliki beberapa package.

Contoh:

```text
Start Jakarta
Rp1.750.000

Start Basecamp
Rp950.000
```

Package dapat menentukan:

- name
- price
- meeting point
- description
- included service

Tetapi:

> Semua package menggunakan schedule capacity yang sama.

---

# 28. Itinerary

Itinerary harus dapat ditampilkan per hari.

Contoh:

```text
Day 1
Jakarta → Basecamp

Day 2
Basecamp → Summit

Day 3
Return
```

---

# 29. Include / Exclude

Setiap trip harus dapat mendefinisikan:

## Include

Contoh:

- transport
- guide
- tent
- meal
- permit

## Exclude

Contoh:

- personal gear
- personal expenses
- health certificate

tergantung trip.

---

# 30. Gear Checklist

Trip mempunyai:

## Mandatory Gear

dan

## Recommended Gear

---

# 31. Surat Kesehatan

Surat kesehatan dapat menjadi requirement untuk trip tertentu.

Website harus menjelaskan requirement tersebut pada Trip Detail.

Jika customer belum memiliki surat kesehatan:

> Customer diarahkan untuk menghubungi admin Open Trip Wildera melalui WhatsApp.

Contoh UX:

```text
Belum memiliki surat kesehatan?

Hubungi admin Wildera untuk informasi dan bantuan lebih lanjut.

[Hubungi Admin]
```

---

# 32. Health Document MVP Rule

Untuk MVP:

- customer tidak perlu upload surat kesehatan ke website
- admin dapat mengelola prosesnya melalui WhatsApp
- website hanya menyediakan requirement dan contact path

Online document upload dapat dievaluasi pada versi berikutnya.

---

# 33. Beginner Friendly

Trip mempunyai indicator:

```text
Beginner Friendly
YES / NO
```

Tetapi tetap disertai explanation.

Contoh:

- minimum fitness
- approximate hiking duration
- terrain
- recommended preparation

---

# 34. Difficulty

Classification:

```text
EASY
MODERATE
HARD
EXTREME
```

Harus mempunyai explanatory copy agar tidak hanya menjadi arbitrary label.

---

# 35. Booking Model

Meskipun customer booking melalui WhatsApp, admin system tetap memiliki entity:

```text
Booking
```

Tujuannya:

- central inventory
- participant management
- trip operation
- reporting

---

# 36. Manual Booking

Admin dapat membuat booking setelah customer dikonfirmasi melalui WhatsApp.

Minimum data:

- customer name
- WhatsApp
- trip
- schedule
- package
- participant quantity
- participant information
- booking status
- notes

---

# 37. Booking Source

Booking dapat memiliki source:

```text
WHATSAPP

INSTAGRAM

WEBSITE

ADMIN

OTHER
```

Untuk MVP sebagian besar diperkirakan:

```text
WEBSITE → WHATSAPP
```

---

# 38. Booking Status MVP

Gunakan status sederhana:

```text
INQUIRY

PENDING_CONFIRMATION

CONFIRMED

CANCELLED

COMPLETED

NO_SHOW
```

Status online payment tidak diperlukan pada MVP.

---

# 39. Participant Information

Minimum:

- full name
- date of birth

Jika dibutuhkan:

- gender
- phone
- identity number
- emergency contact
- notes

Final required field dapat berbeda per trip.

---

# 40. Emergency Contact

**[ASSUMPTION APPROVED]**

Emergency contact dapat dikumpulkan jika diperlukan untuk operasional trip.

---

# 41. Customer Account

Tidak tersedia pada MVP.

Customer tidak perlu:

- register
- login
- membuat password

---

# 42. Check Booking

Karena booking dikelola manual melalui WhatsApp, fitur Check Booking dapat menjadi:

### P1

bukan P0 wajib.

MVP dapat mengandalkan confirmation dari admin WhatsApp.

Jika dibangun:

customer dapat menggunakan:

```text
Booking Number
+
WhatsApp / Email
```

---

# 43. Private Trip

Private Trip tetap menjadi P0.

Landing page menampilkan:

- flexible schedule
- private group
- custom meeting point
- custom plan
- dedicated coordination

---

# 44. Private Trip Form

Minimum:

- destination
- preferred date
- participant count
- meeting point
- customer name
- WhatsApp

Optional:

- alternative date
- budget
- requirements
- email

---

# 45. Private Trip Flow

```text
Private Trip Page
↓
Inquiry Form
↓
Lead Created
↓
Admin Contact
↓
Discussion
↓
Quotation
↓
Agreement
↓
Admin Creates Booking
```

Payment tetap ditangani di luar website pada MVP.

---

# 46. Private Trip Status

```text
NEW

CONTACTED

QUOTATION_SENT

NEGOTIATION

BOOKED

LOST
```

---

# 47. Admin Login

Tidak ada public registration.

Admin account dibuat melalui authorized process.

---

# 48. Admin Roles

Potential roles:

- SUPER_ADMIN
- OPERATIONS
- CONTENT
- FINANCE

Finance role belum terlalu penting sampai payment module dikembangkan.

---

# 49. Admin Dashboard

Minimum:

- upcoming trips
- available capacity
- recent bookings
- new Private Trip inquiries

Optional P1:

- revenue
- payment report
- conversion report

---

# 50. Trip Management

Admin dapat:

- create
- edit
- save draft
- publish
- unpublish
- archive
- duplicate

---

# 51. Trip vs Schedule

Wajib dipisahkan.

```text
TRIP

Open Trip Prau via Patak Banteng
```

dapat mempunyai:

```text
SCHEDULES

12–13 Sep

19–20 Sep

26–27 Sep
```

Admin tidak membuat Trip baru untuk setiap tanggal.

---

# 52. Schedule Management

Admin mengelola:

- start date
- end date
- registration deadline
- capacity
- status
- package
- notes

---

# 53. Booking Management

Admin dapat:

- create booking
- edit booking
- cancel booking
- complete booking
- view participant
- search
- filter by schedule
- filter by status

---

# 54. Participant Manifest

Admin harus dapat melihat:

```text
Trip
↓
Schedule
↓
Booking
↓
Participants
```

P1:

export CSV/Excel.

---

# 55. Content Management

P0:

- trip
- mountain
- route
- FAQ
- homepage basic content

P1:

- guides
- testimonials
- gallery
- blog

---

# 56. WhatsApp Integration

P0.

Website menyediakan:

- global WhatsApp CTA
- trip-specific WhatsApp CTA
- health-requirement WhatsApp CTA
- private trip WhatsApp fallback

---

# 57. SEO

P0.

Minimum:

- clean URL
- title
- meta description
- canonical
- OpenGraph
- sitemap
- robots configuration
- image alt
- indexable trip page
- indexable mountain page

---

# 58. Example URL

```text
/trip/open-trip-rinjani
```

```text
/gunung/rinjani
```

```text
/private-trip
```

---

# 59. Analytics

P0 events:

```text
view_home

view_trip_list

view_trip

select_schedule

select_package

click_book_whatsapp

click_health_whatsapp

private_trip_view

private_trip_inquiry
```

---

# 60. Primary Conversion Funnel

Karena belum ada online checkout:

```text
Trip Detail View
↓
Schedule Selected
↓
WhatsApp Booking Click
```

Website conversion utama:

> **WhatsApp Booking Click**

---

# 61. KPI

## Trip → WhatsApp Conversion

```text
Trip WhatsApp Clicks
÷
Trip Detail Views
```

## Private Trip Lead Conversion

```text
Private Trip Inquiries
÷
Private Trip Visitors
```

## Schedule Interest

```text
Schedule Selection
÷
Trip Detail View
```

## Confirmed Booking Rate

Jika admin data memungkinkan:

```text
Confirmed Booking
÷
WhatsApp Leads
```

Ini lebih bernilai daripada sekadar page views.

---

# 62. Legal Pages

P0:

- Terms & Conditions
- Privacy Policy
- Cancellation Policy
- Safety / Participation Policy

Refund Policy dapat tetap dibuat walaupun pembayaran dilakukan secara manual.

---

# 63. Cancellation / Refund

Rules detail belum dikunci sebagai business policy.

Untuk MVP:

website harus mampu menampilkan policy setelah ditentukan.

Tidak diperlukan automation.

Admin menangani case cancellation/refund secara manual.

---

# 64. Security

Minimum:

- secure admin authentication
- admin-only management pages
- validation
- rate limiting pada form
- protected personal information
- file upload restrictions jika nanti digunakan
- audit terhadap critical admin operation

---

# 65. Privacy

Data minimization wajib.

Website tidak boleh meminta data yang tidak diperlukan untuk:

- booking
- safety
- trip operation

---

# 66. Performance

Mobile page harus dioptimalkan.

Photography tidak boleh membuat website terlalu lambat.

Image optimization wajib.

---

# 67. Accessibility

Minimum:

- proper labels
- keyboard navigation
- visible focus
- readable contrast
- accessible form error
- image alternative text

---

# 68. Error State

Harus dirancang untuk:

- trip not found
- schedule unavailable
- sold out
- Private Trip form failed
- WhatsApp unavailable
- server error

---

# 69. Empty State

Contoh:

```text
Belum ada trip pada periode tersebut.

[Lihat Semua Trip]

[Hubungi Wildera]
```

---

# 70. Critical Edge Cases

## EC-01

Schedule SOLD OUT tetapi customer masih membuka old/cached page.

Expected:

system tetap menggunakan current capacity.

---

## EC-02

Dua customer WhatsApp untuk seat terakhir.

Expected:

admin hanya mengkonfirmasi booking sampai schedule capacity terpenuhi.

---

## EC-03

Admin memasukkan booking baru melebihi capacity.

Expected:

system menolak atau memberikan blocking validation.

---

## EC-04

Confirmed customer cancel.

Expected:

seat kembali available setelah booking menjadi CANCELLED.

---

## EC-05

Admin menurunkan capacity di bawah confirmed participant.

Expected:

blocking warning.

---

## EC-06

Customer memilih schedule lama.

Expected:

schedule CLOSED tidak mempunyai active booking CTA.

---

## EC-07

Trip cancelled.

Expected:

status schedule menjadi CANCELLED.

---

## EC-08

Private Trip form duplicate.

Expected:

admin tetap dapat melihat leads dan mengenali duplicate contact.

---

## EC-09

Customer belum mempunyai surat kesehatan.

Expected:

CTA menghubungi admin tersedia.

---

## EC-10

WhatsApp booking CTA digunakan tanpa schedule selection.

Expected:

user diminta memilih schedule terlebih dahulu apabila trip mempunyai multiple schedules.

---

# 71. Core User Stories

## US-001

As a visitor,  
I want to see upcoming trips,  
so that I can select a trip.

---

## US-002

As a visitor,  
I want to filter trip schedules,  
so that I can find a suitable departure.

---

## US-003

As a visitor,  
I want to understand trip details,  
so that I know what I am purchasing.

---

## US-004

As a visitor,  
I want to select a schedule,  
so that I can contact Wildera regarding that departure.

---

## US-005

As a potential customer,  
I want WhatsApp to automatically include my selected trip information,  
so that I don't need to explain everything again.

---

## US-006

As a customer without a health certificate,  
I want an easy way to contact Wildera,  
so that I know what I need to do.

---

## US-007

As an admin,  
I want to record confirmed bookings,  
so that schedule availability remains accurate.

---

## US-008

As an admin,  
I want capacity managed per schedule,  
so that all packages share one accurate trip inventory.

---

## US-009

As an operations admin,  
I want to see participants per schedule,  
so that I can prepare the trip.

---

## US-010

As a group traveler,  
I want to request a Private Trip,  
so that I can arrange my own schedule.

---

# 72. Acceptance Criteria — WhatsApp Booking

GIVEN:

a published trip has at least one AVAILABLE schedule

WHEN:

customer selects the schedule and presses Book via WhatsApp

THEN:

WhatsApp opens with:

- trip name
- schedule
- selected package if applicable

AND:

the message is addressed to Wildera's configured business WhatsApp.

---

# 73. Acceptance Criteria — Capacity

GIVEN:

schedule capacity is 20

AND:

18 participants are confirmed

WHEN:

admin creates booking for 2 participants

THEN:

available seat becomes 0

AND:

schedule can become SOLD_OUT.

---

# 74. Acceptance Criteria — Capacity Protection

GIVEN:

schedule has 1 available seat

WHEN:

admin attempts to confirm 2 participants

THEN:

system blocks confirmation

AND:

capacity is not exceeded.

---

# 75. Acceptance Criteria — Health Requirement

GIVEN:

a trip requires a health certificate

WHEN:

customer views Trip Detail

THEN:

health certificate requirement is visible

AND:

customer sees guidance to contact admin if they do not yet have one.

---

# 76. Acceptance Criteria — Private Trip

GIVEN:

customer completes required Private Trip information

WHEN:

form is submitted successfully

THEN:

lead is created

AND:

admin can view the inquiry.

---

# 77. Release Acceptance Criteria

MVP is production-ready when:

1. Homepage works.
2. Trip Catalog works.
3. Mountain pages work.
4. Trip Details display complete information.
5. Active schedules display correct availability.
6. Customer can select schedule.
7. Customer can click Book via WhatsApp.
8. Contextual WhatsApp message works.
9. Health requirement can be displayed.
10. Health assistance WhatsApp CTA works.
11. Admin can create/edit Trip.
12. Admin can create/edit Schedule.
13. Capacity works per Schedule.
14. Admin can create manual Booking.
15. System prevents booking beyond capacity.
16. Admin can view Participant.
17. Private Trip inquiry works.
18. Admin can manage Private Trip leads.
19. SEO fundamentals work.
20. Analytics tracks key conversion events.
21. Legal pages are available.
22. Mobile UX passes launch QA.

---

# 78. Product Risks

## Scope Creep

Mitigation:

payment/payment gateway stays outside MVP.

## Outdated Capacity

Mitigation:

all confirmed bookings must be entered into admin.

## WhatsApp Dependency

Mitigation:

website provides complete information before WhatsApp handoff.

## Admin Discipline

If admin accepts booking outside system without updating schedule, availability becomes inaccurate.

Mitigation:

central booking procedure must be operational policy.

## Poor Mobile Performance

Mitigation:

optimize photography and prioritize mobile QA.

---

# 79. Confirmed Assumptions

The following assumptions are now accepted:

### A-01

Customer account is not required.

### A-02

WhatsApp remains primary booking/support channel.

### A-03

MVP language is Bahasa Indonesia.

### A-04

Price uses Rupiah.

### A-05

Admin can create manual bookings.

### A-06

Private Trip quotation is handled manually.

### A-07

Customer dashboard is not required.

### A-08

Payment gateway is not required for MVP.

### A-09

Online payment expiry is not required for MVP.

### A-10

Health certificate is not uploaded to website in MVP.

### A-11

Customer without health certificate can contact Open Trip admin through WhatsApp.

### A-12

Capacity is calculated per Schedule, not per Package.

---

# 80. Open Business Policies

Tidak menghambat UX/architecture awal, tetapi harus ditentukan sebelum public launch:

1. Cancellation policy customer.
2. Refund policy.
3. Policy jika Wildera membatalkan trip.
4. Policy jika minimum participant tidak tercapai.
5. Participant name replacement.
6. Reschedule policy.
7. Minimum age.
8. Requirement participant di bawah umur.
9. Exact mandatory participant data.
10. Exact health requirement per mountain/trip.

---

# 81. Product Roadmap

## Release 1 — MVP

```text
Discovery
+
Trip Catalog
+
Trip Detail
+
WhatsApp Booking
+
Manual Booking
+
Schedule Capacity
+
Private Trip
+
Admin
+
SEO
+
Analytics
```

---

## Release 1.1

Potential:

- Blog
- Gallery
- Testimonial
- Guide profile
- participant export
- better reporting
- automated notifications

---

## Release 1.2

Potential:

- online customer booking form
- booking lookup
- waiting list
- promo

---

## Release 2 — Payment

Draft:

```text
Online Checkout
↓
DP / Full Payment
↓
Payment Gateway
↓
Payment Confirmation
↓
Pelunasan
↓
Refund
```

Only build this after the MVP booking workflow is proven.

---

# 82. North Star

Untuk MVP, North Star digital:

> **Qualified Booking Leads from Website**

Operational North Star:

> **Confirmed Trip Bookings**

Supporting metrics:

- WhatsApp booking conversion
- Private Trip leads
- confirmed booking rate
- trip occupancy rate
- organic traffic

---

# 83. Final MVP Flow

```text
Instagram / Google
        ↓
Wildera Website
        ↓
Trip Catalog
        ↓
Trip Detail
        ↓
Select Schedule
        ↓
Select Package
        ↓
WhatsApp Booking
        ↓
Admin Confirmation
        ↓
Manual Booking
        ↓
Capacity Updated
        ↓
Participant Recorded
        ↓
Trip
```

Private Trip:

```text
Visitor
↓
Private Trip
↓
Inquiry
↓
Admin
↓
Discussion / Quotation
↓
Agreement
↓
Manual Booking
↓
Trip
```

---

# 84. Approval Status

Product assumptions telah dikonfirmasi.

Payment scope telah dipindahkan keluar dari MVP.

Capacity model telah dikonfirmasi:

> **Per Schedule**

Health certificate handling telah dikonfirmasi:

> **Information + WhatsApp assistance, tanpa upload document pada MVP.**

Dokumen tetap berstatus:

**REVIEW**

hingga cancellation, refund, dan basic participation policies dikunci.

Namun keputusan yang belum selesai tersebut **tidak menghalangi pengerjaan dokumen UX Specification**.

Next document:

`02_UX_Specification_Wildera.md`