import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import argon2 from 'argon2';
import { Client } from 'pg';

const root = resolve(__dirname, '../../../..');
const name = `wildera_content_test_${randomUUID().replaceAll('-', '')}`;
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
  process.env.SESSION_SECRET =
    'content-test-session-secret-at-least-32-chars-long';
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

test('Content CMS (FAQ & Content Pages) Lifecycle, Audit, and Public Filters', async () => {
  const superAdminRoleId = randomUUID();
  const superAdminId = randomUUID();
  const password = 'SuperAdminPassword123!';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await db.query(
    "INSERT INTO roles(id,name,slug) VALUES ($1,'Super Admin','SUPER_ADMIN')",
    [superAdminRoleId],
  );
  await db.query(
    "INSERT INTO admin_users(id,name,email,password_hash,status) VALUES ($1,'Super Admin','admin-cms@wildera.test',$2,'ACTIVE')",
    [superAdminId, passwordHash],
  );
  await db.query(
    'INSERT INTO admin_user_roles(admin_user_id,role_id) VALUES ($1,$2)',
    [superAdminId, superAdminRoleId],
  );

  const { createApp } = await import('../../src/app');
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();

  try {
    // 1. Unauthenticated admin requests are rejected
    const unauthFaqs = await fetch(`${baseUrl}/api/v1/admin/faqs`);
    assert.equal(unauthFaqs.status, 401);
    const unauthPages = await fetch(`${baseUrl}/api/v1/admin/content-pages`);
    assert.equal(unauthPages.status, 401);

    // 2. Admin login to get session cookie
    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin-cms@wildera.test',
        password,
      }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie);

    // ==========================================
    // 3. FAQ Lifecycle: Create, List, Public view, Update, Delete
    // ==========================================
    const createFaq1 = await fetch(`${baseUrl}/api/v1/admin/faqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        category: 'Booking',
        question: 'Apakah bisa refund?',
        answer: 'Refund dapat diajukan sesuai cancellation policy.',
        sortOrder: 1,
        status: 'PUBLISHED',
      }),
    });
    assert.equal(createFaq1.status, 201);
    const faq1Res = (await createFaq1.json()) as { data: { id: string } };
    const faq1 = faq1Res.data;
    assert.ok(faq1.id);

    const createFaq2Draft = await fetch(`${baseUrl}/api/v1/admin/faqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        category: 'Booking',
        question: 'Draft FAQ pertanyaan rahasia?',
        answer: 'Jawaban masih draft.',
        sortOrder: 2,
        status: 'DRAFT',
      }),
    });
    assert.equal(createFaq2Draft.status, 201);
    const faq2Res = (await createFaq2Draft.json()) as { data: { id: string } };
    const faq2 = faq2Res.data;

    // Admin list returns both (2 items)
    const adminFaqList = await fetch(`${baseUrl}/api/v1/admin/faqs`, {
      headers: { Cookie: cookie },
    });
    assert.equal(adminFaqList.status, 200);
    const adminFaqJson = (await adminFaqList.json()) as {
      data: Array<{ id: string; status: string }>;
    };
    assert.equal(adminFaqJson.data.length, 2);

    // Public FAQ endpoint only returns PUBLISHED (1 item)
    const publicFaqList = await fetch(`${baseUrl}/api/v1/faqs`);
    assert.equal(publicFaqList.status, 200);
    const publicFaqJson = (await publicFaqList.json()) as {
      data: Array<{
        id: string;
        question: string;
      }>;
    };
    assert.equal(publicFaqJson.data.length, 1);
    assert.equal(publicFaqJson.data[0]?.id, faq1.id);

    // Update FAQ
    const updateFaq = await fetch(`${baseUrl}/api/v1/admin/faqs/${faq1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        answer: 'Refund maksimal H-7 sebelum keberangkatan trip.',
      }),
    });
    assert.equal(updateFaq.status, 200);
    const updatedFaqJson = (await updateFaq.json()) as {
      data: { answer: string };
    };
    assert.equal(
      updatedFaqJson.data.answer,
      'Refund maksimal H-7 sebelum keberangkatan trip.',
    );

    // Delete Draft FAQ
    const deleteFaq = await fetch(`${baseUrl}/api/v1/admin/faqs/${faq2.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    assert.equal(deleteFaq.status, 200);

    // ==========================================
    // 4. ContentPage Lifecycle: Create, List, Public view, Update, Delete
    // ==========================================
    const createPage1 = await fetch(`${baseUrl}/api/v1/admin/content-pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        pageKey: 'terms',
        title: 'Syarat dan Ketentuan Pendakian',
        slug: 'terms',
        content: 'Konten lengkap syarat dan ketentuan...',
        status: 'PUBLISHED',
      }),
    });
    assert.equal(createPage1.status, 201);
    const page1Res = (await createPage1.json()) as {
      data: { id: string; slug: string };
    };
    const page1 = page1Res.data;
    assert.ok(page1.id);

    const createPageDraft = await fetch(
      `${baseUrl}/api/v1/admin/content-pages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          pageKey: 'safety',
          title: 'Draft Standar Keselamatan',
          slug: 'safety-draft',
          content: 'Konten draft SOP...',
          status: 'DRAFT',
        }),
      },
    );
    assert.equal(createPageDraft.status, 201);
    const pageDraftRes = (await createPageDraft.json()) as {
      data: { id: string; slug: string };
    };
    const pageDraft = pageDraftRes.data;

    // Public reader: PUBLISHED page is found
    const publicPageRes = await fetch(`${baseUrl}/api/v1/content-pages/terms`);
    assert.equal(publicPageRes.status, 200);
    const publicPageJson = (await publicPageRes.json()) as {
      data: {
        title: string;
        slug: string;
      };
    };
    assert.equal(publicPageJson.data.slug, 'terms');

    // Public reader: DRAFT page returns 404
    const publicDraftRes = await fetch(
      `${baseUrl}/api/v1/content-pages/safety-draft`,
    );
    assert.equal(publicDraftRes.status, 404);

    // Update ContentPage
    const updatePage = await fetch(
      `${baseUrl}/api/v1/admin/content-pages/${page1.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          title: 'Syarat dan Ketentuan Wildera Adventure',
        }),
      },
    );
    assert.equal(updatePage.status, 200);
    const updatedPageJson = (await updatePage.json()) as {
      data: { title: string };
    };
    assert.equal(
      updatedPageJson.data.title,
      'Syarat dan Ketentuan Wildera Adventure',
    );

    // Delete Draft page
    const deletePage = await fetch(
      `${baseUrl}/api/v1/admin/content-pages/${pageDraft.id}`,
      {
        method: 'DELETE',
        headers: { Cookie: cookie },
      },
    );
    assert.equal(deletePage.status, 200);

    // Verify audit logs were written for content operations
    const auditRes = await db.query(
      "SELECT action, entity_type FROM audit_logs WHERE entity_type IN ('FAQ', 'CONTENT_PAGE') ORDER BY created_at ASC",
    );
    assert.ok(auditRes.rows.length >= 4);
    const actions = auditRes.rows.map((r: { action: string }) => r.action);
    assert.ok(actions.includes('FAQ_UPDATED'));
    assert.ok(actions.includes('CONTENT_PAGE_DELETED'));
  } finally {
    await app.close();
  }
});
