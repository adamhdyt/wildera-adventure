import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCreateFaq,
  validateUpdateFaq,
  validateFaqQuery,
  validateCreateContentPage,
  validateUpdateContentPage,
  validateContentPageQuery,
} from '@wildera/validation';

test('FAQ Validation - Create', async (t) => {
  await t.test('accepts valid payload', () => {
    const res = validateCreateFaq({
      category: 'Booking',
      question: 'Bagaimana cara booking trip?',
      answer: 'Booking melalui website atau WhatsApp resmi kami.',
      sortOrder: 1,
      status: 'PUBLISHED',
    });

    assert.equal(res.valid, true);
    assert.equal(res.data?.question, 'Bagaimana cara booking trip?');
    assert.equal(res.data?.category, 'Booking');
    assert.equal(res.data?.status, 'PUBLISHED');
  });

  await t.test('rejects missing question or answer', () => {
    const res = validateCreateFaq({
      category: 'Booking',
    });

    assert.equal(res.valid, false);
    assert.ok(res.errors?.question);
    assert.ok(res.errors?.answer);
  });

  await t.test('rejects invalid status', () => {
    const res = validateCreateFaq({
      question: 'Pertanyaan',
      answer: 'Jawaban',
      status: 'INVALID_STATUS',
    });

    assert.equal(res.valid, false);
    assert.ok(res.errors?.status);
  });
});

test('FAQ Validation - Update', async (t) => {
  await t.test('accepts partial update', () => {
    const res = validateUpdateFaq({
      answer: 'Jawaban yang diperbarui.',
      sortOrder: 2,
    });

    assert.equal(res.valid, true);
    assert.equal(res.data?.answer, 'Jawaban yang diperbarui.');
    assert.equal(res.data?.sortOrder, 2);
  });

  await t.test('rejects empty question string', () => {
    const res = validateUpdateFaq({
      question: '   ',
    });

    assert.equal(res.valid, false);
    assert.ok(res.errors?.question);
  });
});

test('FAQ Validation - Query', async (t) => {
  await t.test('accepts valid query parameters', () => {
    const res = validateFaqQuery({
      category: 'Booking',
      status: 'PUBLISHED',
      search: 'simaksi',
    });

    assert.equal(res.valid, true);
    assert.equal(res.data?.category, 'Booking');
    assert.equal(res.data?.status, 'PUBLISHED');
    assert.equal(res.data?.search, 'simaksi');
  });

  await t.test('rejects invalid status in query', () => {
    const res = validateFaqQuery({
      status: 'UNKNOWN',
    });

    assert.equal(res.valid, false);
    assert.ok(res.errors?.status);
  });
});

test('ContentPage Validation - Create', async (t) => {
  await t.test('accepts valid payload', () => {
    const res = validateCreateContentPage({
      pageKey: 'about',
      title: 'Tentang Wildera Adventure',
      slug: 'tentang',
      content: 'Deskripsi lengkap tentang kami...',
      status: 'PUBLISHED',
      seoTitle: 'Tentang Kami - Wildera',
      seoDescription: 'Informasi tentang operator Wildera Adventure',
    });

    assert.equal(res.valid, true);
    assert.equal(res.data?.pageKey, 'about');
    assert.equal(res.data?.slug, 'tentang');
    assert.equal(res.data?.status, 'PUBLISHED');
  });

  await t.test('auto-slugifies title if slug omitted', () => {
    const res = validateCreateContentPage({
      pageKey: 'safety',
      title: 'Standar Keselamatan dan SOP',
      content: 'Protokol keselamatan...',
    });

    assert.equal(res.valid, true);
    assert.equal(res.data?.slug, 'standar-keselamatan-dan-sop');
  });

  await t.test('rejects missing pageKey, title or content', () => {
    const res = validateCreateContentPage({});
    assert.equal(res.valid, false);
    assert.ok(res.errors?.pageKey);
    assert.ok(res.errors?.title);
    assert.ok(res.errors?.content);
  });
});

test('ContentPage Validation - Update', async (t) => {
  await t.test('accepts partial update', () => {
    const res = validateUpdateContentPage({
      title: 'Syarat & Ketentuan Terkini',
      status: 'PUBLISHED',
    });

    assert.equal(res.valid, true);
    assert.equal(res.data?.title, 'Syarat & Ketentuan Terkini');
    assert.equal(res.data?.status, 'PUBLISHED');
  });
});

test('ContentPage Validation - Query', async (t) => {
  await t.test('accepts status and search filter', () => {
    const res = validateContentPageQuery({
      status: 'DRAFT',
      search: 'policy',
    });

    assert.equal(res.valid, true);
    assert.equal(res.data?.status, 'DRAFT');
    assert.equal(res.data?.search, 'policy');
  });
});
