import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';

const root = resolve(__dirname, '../../../..');
const name = `wildera_public_test_${randomUUID().replaceAll('-', '')}`;
const source = process.env.DATABASE_URL;
if (!source) {
  throw new Error(
    'DATABASE_URL is required; run npm run db:local:start first.',
  );
}
const url = new URL(source);
url.pathname = `/${name}`;
url.search = '';
const connectionString = url.toString();
url.pathname = '/postgres';
const admin = new Client({ connectionString: url.toString() });
const db = new Client({ connectionString });

const previousEnvironment = {
  databaseUrl: process.env.DATABASE_URL,
  nodeEnvironment: process.env.NODE_ENV,
  sessionSecret: process.env.SESSION_SECRET,
};
let created = false;

before(async () => {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${name}"`);
  created = true;
  const migration = spawnSync(
    process.execPath,
    ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
    {
      cwd: root,
      env: { ...process.env, DATABASE_URL: connectionString },
      encoding: 'utf8',
      timeout: 60000,
    },
  );
  assert.equal(migration.status, 0, migration.stderr);
  await db.connect();
  process.env.DATABASE_URL = connectionString;
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET = 'public-test-session-secret-at-least-32-chars';
});

after(async () => {
  await db.end();
  try {
    if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  } finally {
    await admin.end();
    if (previousEnvironment.databaseUrl === undefined)
      delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousEnvironment.databaseUrl;
    if (previousEnvironment.nodeEnvironment === undefined)
      delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment.nodeEnvironment;
    if (previousEnvironment.sessionSecret === undefined)
      delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previousEnvironment.sessionSecret;
  }
});

test('Public API endpoints exclude draft, sensitive, participant, and admin data', async () => {
  const { createApp } = await import('../../src/app');
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  const appUrl = await app.getUrl();

  try {
    // 1. Fixture: Admin User for FK relations
    const roleId = randomUUID();
    await db.query(
      `INSERT INTO roles (id, name, slug, description)
       VALUES ($1, 'Super Admin', 'SUPER_ADMIN', 'Super admin role')`,
      [roleId],
    );

    const userId = randomUUID();
    const passwordHash = await argon2.hash('Secret1234!', {
      type: argon2.argon2id,
    });
    await db.query(
      "INSERT INTO admin_users(id,name,email,password_hash,status) VALUES ($1,'Admin Tester','admin@wildera.test',$2,'ACTIVE')",
      [userId, passwordHash],
    );

    // 2. Fixture: Destinations (1 Active, 1 Inactive)
    const destActiveId = randomUUID();
    await db.query(
      `INSERT INTO destinations (id, name, slug, region, province, description, status)
       VALUES ($1, 'Lombok & Rinjani', 'lombok-rinjani', 'Nusa Tenggara Barat', 'NTB', 'Destinasi eksotis', 'ACTIVE')`,
      [destActiveId],
    );

    const destInactiveId = randomUUID();
    await db.query(
      `INSERT INTO destinations (id, name, slug, region, province, description, status)
       VALUES ($1, 'Papua Hidden', 'papua-hidden', 'Papua', 'Papua', 'Destinasi tersembunyi', 'INACTIVE')`,
      [destInactiveId],
    );

    // 3. Fixture: Mountains (1 Published on destActive, 1 Draft)
    const mountainPublishedId = randomUUID();
    await db.query(
      `INSERT INTO mountains (id, destination_id, name, slug, altitude_m, default_difficulty, best_season, status, description)
       VALUES ($1, $2, 'Gunung Rinjani', 'gunung-rinjani', 3726, 'HARD', 'Mei - Oktober', 'PUBLISHED', 'Gunung berapi megah di Lombok')`,
      [mountainPublishedId, destActiveId],
    );

    const mountainDraftId = randomUUID();
    await db.query(
      `INSERT INTO mountains (id, destination_id, name, slug, altitude_m, default_difficulty, status)
       VALUES ($1, $2, 'Gunung Tambora', 'gunung-tambora', 2850, 'MODERATE', 'DRAFT')`,
      [mountainDraftId, destActiveId],
    );

    // Route on Rinjani
    const routeId = randomUUID();
    await db.query(
      `INSERT INTO routes (id, mountain_id, name, slug, distance_km, elevation_gain_m, estimated_duration_hours, difficulty, status)
       VALUES ($1, $2, 'Jalur Sembalun', 'jalur-sembalun', 14.5, 2600, 8.5, 'HARD', 'PUBLISHED')`,
      [routeId, mountainPublishedId],
    );

    // Media for Mountain
    const mediaMountainId = randomUUID();
    await db.query(
      `INSERT INTO media_assets (id, object_key, mime_type, file_size_bytes, url, alt_text, created_by)
       VALUES ($1, 'rinjani-cover.jpg', 'image/jpeg', 204800, 'https://cdn.wildera.test/rinjani-cover.jpg', 'Pemandangan Danau Segara Anak', $2)`,
      [mediaMountainId, userId],
    );
    await db.query(
      `INSERT INTO mountain_media (mountain_id, media_id, media_role, sort_order)
       VALUES ($1, $2, 'COVER', 0)`,
      [mountainPublishedId, mediaMountainId],
    );

    // 4. Fixture: Trips (1 Published, 1 Draft)
    const tripPublishedId = randomUUID();
    await db.query(
      `INSERT INTO trips (
         id, mountain_id, route_id, name, slug, trip_type, duration_days, duration_nights,
         difficulty, beginner_friendly, short_description, description, health_certificate_required,
         minimum_age, maximum_age, status, created_by
       ) VALUES (
         $1, $2, $3, 'Open Trip Gunung Rinjani 4D3N', 'open-trip-rinjani-4d3n', 'OPEN_TRIP',
         4, 3, 'HARD', false, 'Petualangan spektakuler ke puncak Rinjani',
         'Deskripsi lengkap pendakian Rinjani dan danau Segara Anak.', true,
         15, 60, 'PUBLISHED', $4
       )`,
      [tripPublishedId, mountainPublishedId, routeId, userId],
    );

    const tripDraftId = randomUUID();
    await db.query(
      `INSERT INTO trips (
         id, mountain_id, name, slug, trip_type, duration_days, duration_nights,
         difficulty, status, created_by
       ) VALUES (
         $1, $2, 'Draft Trip Tambora', 'draft-trip-tambora', 'OPEN_TRIP',
         3, 2, 'MODERATE', 'DRAFT', $3
       )`,
      [tripDraftId, mountainPublishedId, userId],
    );

    // Trip Media (Cover & Gallery)
    const mediaTripCoverId = randomUUID();
    await db.query(
      `INSERT INTO media_assets (id, object_key, mime_type, file_size_bytes, url, alt_text, created_by)
       VALUES ($1, 'trip-cover.jpg', 'image/jpeg', 300000, 'https://cdn.wildera.test/trip-cover.jpg', 'Summit Attack Rinjani', $2)`,
      [mediaTripCoverId, userId],
    );
    await db.query(
      `INSERT INTO trip_media (trip_id, media_id, media_role, sort_order)
       VALUES ($1, $2, 'COVER', 0)`,
      [tripPublishedId, mediaTripCoverId],
    );

    // Trip Nested Content (Itinerary, Facility, Gear, Faq)
    await db.query(
      `INSERT INTO trip_itineraries (id, trip_id, day_number, title, description, sort_order)
       VALUES ($1, $2, 1, 'Hari 1: Basecamp Sembalun ke Pelawangan Sembalun', 'Trekking melalui padang savana.', 1)`,
      [randomUUID(), tripPublishedId],
    );
    await db.query(
      `INSERT INTO trip_facilities (id, trip_id, facility_type, name, description, sort_order)
       VALUES 
       ($1, $3, 'INCLUDE', 'Tenda & Matras', 'Kapasitas 4 orang diisi 3', 1),
       ($2, $3, 'EXCLUDE', 'Pengeluaran Pribadi', 'Camilan dan oleh-oleh', 2)`,
      [randomUUID(), randomUUID(), tripPublishedId],
    );
    await db.query(
      `INSERT INTO trip_gears (id, trip_id, gear_type, name, description, sort_order)
       VALUES 
       ($1, $3, 'MANDATORY', 'Sepatu Trekking', 'Sol bergerigi tebal', 1),
       ($2, $3, 'RECOMMENDED', 'Trekking Pole', 'Dua buah pole lipat', 2)`,
      [randomUUID(), randomUUID(), tripPublishedId],
    );
    await db.query(
      `INSERT INTO trip_faqs (id, trip_id, question, answer, sort_order)
       VALUES ($1, $2, 'Apakah porter menanggung beban tas pribadi?', 'Porter hanya membawa tenda dan logistik tim.', 1)`,
      [randomUUID(), tripPublishedId],
    );

    // Trip Schedule & Packages (1 OPEN schedule, 1 DRAFT schedule)
    const meetingPointId = randomUUID();
    await db.query(
      `INSERT INTO meeting_points (id, name, city, address, latitude, longitude, status)
       VALUES ($1, 'Bandara Internasional Lombok (LOP)', 'Praya', 'Jl. Bypass BIL', -8.761667, 116.275000, 'ACTIVE')`,
      [meetingPointId],
    );

    const scheduleOpenId = randomUUID();
    await db.query(
      `INSERT INTO trip_schedules (id, trip_id, start_date, end_date, registration_deadline, capacity, minimum_participants, status, created_by)
       VALUES ($1, $2, '2026-10-15', '2026-10-18', '2026-10-10 23:59:59+07', 20, 5, 'OPEN', $3)`,
      [scheduleOpenId, tripPublishedId, userId],
    );

    const scheduleDraftId = randomUUID();
    await db.query(
      `INSERT INTO trip_schedules (id, trip_id, start_date, end_date, capacity, minimum_participants, status, created_by)
       VALUES ($1, $2, '2026-11-01', '2026-11-04', 15, 5, 'DRAFT', $3)`,
      [scheduleDraftId, tripPublishedId, userId],
    );

    // Package on Open Schedule
    const packageId = randomUUID();
    await db.query(
      `INSERT INTO schedule_packages (id, schedule_id, meeting_point_id, name, description, price, status, sort_order)
       VALUES ($1, $2, $3, 'Paket Regular All-In', 'Sudah termasuk porter dan makan', 2850000, 'ACTIVE', 1)`,
      [packageId, scheduleOpenId, meetingPointId],
    );

    // Bookings to test capacity computation & participant privacy
    const customerId = randomUUID();
    await db.query(
      `INSERT INTO customers (id, email, full_name, whatsapp_number)
       VALUES ($1, 'secret-participant@example.com', 'Rahasia Rahadian', '+628123456789')`,
      [customerId],
    );
    const bookingId = randomUUID();
    await db.query(
      `INSERT INTO bookings (
         id, booking_number, schedule_id, package_id, customer_id, source,
         status, total_amount, participant_count, contact_name, contact_whatsapp, notes, created_by
       ) VALUES (
         $1, 'WLD-TEST-001', $2, $3, $4, 'WEBSITE_WHATSAPP',
         'CONFIRMED', 5700000, 2, 'Rahasia Rahadian', '+628****6789', 'Catatan medis sangat rahasia', $5
       )`,
      [bookingId, scheduleOpenId, packageId, customerId, userId],
    );

    // 5. Fixture: FAQs (1 Published, 1 Draft)
    const faqPublishedId = randomUUID();
    await db.query(
      `INSERT INTO faqs (id, category, question, answer, sort_order, status)
       VALUES ($1, 'Persiapan', 'Berapa liter air minum yang harus dibawa?', 'Minimal 2 liter per pendaki saat start.', 1, 'PUBLISHED')`,
      [faqPublishedId],
    );
    const faqDraftId = randomUUID();
    await db.query(
      `INSERT INTO faqs (id, category, question, answer, sort_order, status)
       VALUES ($1, 'Internal', 'Draft FAQ tidak boleh tampil', 'Jawaban draft', 2, 'DRAFT')`,
      [faqDraftId],
    );

    // 6. Fixture: Content Pages (1 Published, 1 Draft)
    const pagePublishedId = randomUUID();
    await db.query(
      `INSERT INTO content_pages (id, page_key, title, slug, content, status, seo_title, seo_description, published_at)
       VALUES ($1, 'terms', 'Syarat dan Ketentuan', 'syarat-ketentuan', '# Ketentuan Umum\n1. Taati aturan taman nasional.', 'PUBLISHED', 'Syarat & Ketentuan Wildera', 'Deskripsi syarat & ketentuan', NOW())`,
      [pagePublishedId],
    );
    const pageDraftId = randomUUID();
    await db.query(
      `INSERT INTO content_pages (id, page_key, title, slug, content, status)
       VALUES ($1, 'internal_memo', 'Memo Internal', 'memo-internal', 'Hanya untuk staff', 'DRAFT')`,
      [pageDraftId],
    );

    // 7. Fixture: Site Settings (1 Public, 1 Private)
    await db.query(
      `INSERT INTO site_settings (id, setting_key, setting_value, is_public)
       VALUES 
       ($1, 'site_name', '"Wildera Adventure"', true),
       ($2, 'business_whatsapp', '"6281234567890"', true),
       ($3, 'internal_secret_api_key', '"super-secret-key-do-not-leak"', false)`,
      [randomUUID(), randomUUID(), randomUUID()],
    );

    // =========================================================================
    // TEST 1: GET /api/v1/destinations
    // =========================================================================
    const destRes = await fetch(`${appUrl}/api/v1/destinations`);
    assert.equal(destRes.status, 200);
    const destJson = await destRes.json();
    assert.equal(destJson.success, true);
    assert.equal(destJson.data.length, 1);
    assert.equal(destJson.data[0].slug, 'lombok-rinjani');
    assert.equal(destJson.data[0].mountainCount, 1);
    // Ensure inactive destination is excluded
    assert.ok(
      !destJson.data.some((d: { slug?: string }) => d.slug === 'papua-hidden'),
    );

    // =========================================================================
    // TEST 2: GET /api/v1/mountains
    // =========================================================================
    const mtnRes = await fetch(`${appUrl}/api/v1/mountains`);
    assert.equal(mtnRes.status, 200);
    const mtnJson = await mtnRes.json();
    assert.equal(mtnJson.success, true);
    assert.equal(mtnJson.data.length, 1);
    assert.equal(mtnJson.data[0].slug, 'gunung-rinjani');
    assert.equal(
      mtnJson.data[0].coverImage.url,
      'https://cdn.wildera.test/rinjani-cover.jpg',
    );
    // Ensure draft mountain is excluded
    assert.ok(
      !mtnJson.data.some((m: { slug?: string }) => m.slug === 'gunung-tambora'),
    );

    // =========================================================================
    // TEST 3: GET /api/v1/mountains/:slug
    // =========================================================================
    const mtnDetailRes = await fetch(
      `${appUrl}/api/v1/mountains/gunung-rinjani`,
    );
    assert.equal(mtnDetailRes.status, 200);
    const mtnDetailJson = await mtnDetailRes.json();
    assert.equal(mtnDetailJson.success, true);
    assert.equal(mtnDetailJson.data.name, 'Gunung Rinjani');
    assert.equal(mtnDetailJson.data.routes.length, 1);
    assert.equal(mtnDetailJson.data.routes[0].name, 'Jalur Sembalun');
    assert.equal(
      mtnDetailJson.data.media.cover.url,
      'https://cdn.wildera.test/rinjani-cover.jpg',
    );
    assert.equal(mtnDetailJson.data.upcomingTrips.length, 1);
    assert.equal(
      mtnDetailJson.data.upcomingTrips[0].name,
      'Open Trip Gunung Rinjani 4D3N',
    );

    // Rejects draft mountain with 404
    const mtnDraftRes = await fetch(
      `${appUrl}/api/v1/mountains/gunung-tambora`,
    );
    assert.equal(mtnDraftRes.status, 404);

    // =========================================================================
    // TEST 4: GET /api/v1/trips
    // =========================================================================
    const tripsRes = await fetch(`${appUrl}/api/v1/trips`);
    assert.equal(tripsRes.status, 200);
    const tripsJson = await tripsRes.json();
    assert.equal(tripsJson.success, true);
    assert.equal(tripsJson.data.length, 1);
    const tripItem = tripsJson.data[0];
    assert.equal(tripItem.slug, 'open-trip-rinjani-4d3n');
    assert.equal(
      tripItem.coverImage.url,
      'https://cdn.wildera.test/trip-cover.jpg',
    );
    assert.equal(tripItem.difficulty, 'HARD');
    assert.equal(tripItem.beginnerFriendly, false);

    // Verify nextSchedule calculation
    assert.ok(tripItem.nextSchedule);
    assert.equal(tripItem.nextSchedule.capacity, 20);
    assert.equal(tripItem.nextSchedule.confirmedSeats, 2); // 2 seats booked
    assert.equal(tripItem.nextSchedule.availableSeats, 18);
    assert.equal(tripItem.nextSchedule.startingPrice, 2850000);

    // Security verify: Public API excludes sensitive admin, participant, and booking fields
    assert.equal(tripItem.createdBy, undefined);
    assert.equal(tripItem.creator, undefined);
    assert.equal(tripItem.bookings, undefined);
    assert.equal(tripItem.participants, undefined);

    // Draft trip is excluded from list
    assert.ok(
      !tripsJson.data.some(
        (t: { slug?: string }) => t.slug === 'draft-trip-tambora',
      ),
    );

    // Test filter query
    const filterTripRes = await fetch(`${appUrl}/api/v1/trips?difficulty=EASY`);
    assert.equal(filterTripRes.status, 200);
    const filterTripJson = await filterTripRes.json();
    assert.equal(filterTripJson.data.length, 0); // No EASY trips

    // =========================================================================
    // TEST 5: GET /api/v1/trips/:slug
    // =========================================================================
    const tripDetailRes = await fetch(
      `${appUrl}/api/v1/trips/open-trip-rinjani-4d3n`,
    );
    assert.equal(tripDetailRes.status, 200);
    const tripDetailJson = await tripDetailRes.json();
    assert.equal(tripDetailJson.success, true);
    const detail = tripDetailJson.data;
    assert.equal(detail.name, 'Open Trip Gunung Rinjani 4D3N');
    assert.equal(detail.itinerary.length, 1);
    assert.equal(detail.includes.length, 1);
    assert.equal(detail.excludes.length, 1);
    assert.equal(detail.mandatoryGear.length, 1);
    assert.equal(detail.recommendedGear.length, 1);
    assert.equal(detail.faqs.length, 1);

    // Schedules verification: excludes DRAFT schedules
    assert.equal(detail.schedules.length, 1);
    assert.equal(detail.schedules[0].lifecycleStatus, 'OPEN');
    assert.equal(detail.schedules[0].bookable, true);
    assert.equal(detail.schedules[0].availableSeats, 18);

    // Packages verification: meeting point included, NO capacity field on package
    assert.equal(detail.schedules[0].packages.length, 1);
    assert.equal(detail.schedules[0].packages[0].name, 'Paket Regular All-In');
    assert.equal(detail.schedules[0].packages[0].price, 2850000);
    assert.ok(detail.schedules[0].packages[0].meetingPoint);
    assert.equal(
      detail.schedules[0].packages[0].meetingPoint.name,
      'Bandara Internasional Lombok (LOP)',
    );
    assert.equal(detail.schedules[0].packages[0].capacity, undefined); // CRITICAL Rule 84

    // Sensitive data exclusion check on detail
    assert.equal(detail.createdBy, undefined);
    assert.equal(detail.creator, undefined);
    assert.equal(detail.bookings, undefined);
    const rawDetailString = JSON.stringify(detail);
    assert.ok(!rawDetailString.includes('secret-participant@example.com'));
    assert.ok(!rawDetailString.includes('Catatan medis sangat rahasia'));

    // Rejects draft trip with 404
    const tripDraftRes = await fetch(
      `${appUrl}/api/v1/trips/draft-trip-tambora`,
    );
    assert.equal(tripDraftRes.status, 404);

    // =========================================================================
    // TEST 6: GET /api/v1/faqs
    // =========================================================================
    const faqsRes = await fetch(`${appUrl}/api/v1/faqs`);
    assert.equal(faqsRes.status, 200);
    const faqsJson = await faqsRes.json();
    assert.equal(faqsJson.success, true);
    assert.equal(faqsJson.data.length, 1);
    assert.equal(
      faqsJson.data[0].question,
      'Berapa liter air minum yang harus dibawa?',
    );
    // Ensure draft FAQ is excluded
    assert.ok(
      !faqsJson.data.some((f: { question?: string }) =>
        f.question?.includes('Draft FAQ'),
      ),
    );

    // =========================================================================
    // TEST 7: GET /api/v1/content-pages/:slug
    // =========================================================================
    const pageRes = await fetch(
      `${appUrl}/api/v1/content-pages/syarat-ketentuan`,
    );
    assert.equal(pageRes.status, 200);
    const pageJson = await pageRes.json();
    assert.equal(pageJson.success, true);
    assert.equal(pageJson.data.title, 'Syarat dan Ketentuan');
    assert.ok(pageJson.data.content.includes('# Ketentuan Umum'));

    // Rejects draft content page with 404
    const pageDraftRes = await fetch(
      `${appUrl}/api/v1/content-pages/memo-internal`,
    );
    assert.equal(pageDraftRes.status, 404);

    // =========================================================================
    // TEST 8: GET /api/v1/site-settings/public
    // =========================================================================
    const settingsRes = await fetch(`${appUrl}/api/v1/site-settings/public`);
    assert.equal(settingsRes.status, 200);
    const settingsJson = await settingsRes.json();
    assert.equal(settingsJson.success, true);
    assert.equal(settingsJson.data.site_name, 'Wildera Adventure');
    assert.equal(settingsJson.data.business_whatsapp, '6281234567890');

    // CRITICAL: Ensure private settings are NEVER returned
    assert.equal(settingsJson.data.internal_secret_api_key, undefined);
    assert.ok(
      !JSON.stringify(settingsJson.data).includes(
        'super-secret-key-do-not-leak',
      ),
    );
  } finally {
    await app.close();
  }
});
