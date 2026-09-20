'use client';

import React, { useState, useTransition } from 'react';
import type { ContentPageItem, ContentStatus, FaqItem } from '@wildera/types';

interface ContentClientProps {
  initialFaqs: FaqItem[];
  initialPages: ContentPageItem[];
  userRoles: readonly string[];
}

export function ContentClient({
  initialFaqs,
  initialPages,
  userRoles,
}: ContentClientProps) {
  const canManage =
    userRoles.includes('SUPER_ADMIN') || userRoles.includes('CONTENT');

  const [activeTab, setActiveTab] = useState<'faq' | 'pages'>('faq');

  // FAQs state
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('ALL');
  const [faqStatusFilter, setFaqStatusFilter] = useState('ALL');

  // FAQ Modal state
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqFormData, setFaqFormData] = useState<{
    category: string;
    question: string;
    answer: string;
    sortOrder: number;
    status: ContentStatus;
  }>({
    category: '',
    question: '',
    answer: '',
    sortOrder: 0,
    status: 'PUBLISHED',
  });

  // Pages state
  const [pages, setPages] = useState<ContentPageItem[]>(initialPages);
  const [pageSearch, setPageSearch] = useState('');
  const [pageStatusFilter, setPageStatusFilter] = useState('ALL');

  // Page Modal state
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [editingPageKey, setEditingPageKey] = useState<string | null>(null);
  const [pageFormData, setPageFormData] = useState<{
    pageKey: string;
    title: string;
    slug: string;
    content: string;
    status: ContentStatus;
    seoTitle: string;
    seoDescription: string;
  }>({
    pageKey: '',
    title: '',
    slug: '',
    content: '',
    status: 'PUBLISHED',
    seoTitle: '',
    seoDescription: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  // Categories list derived from FAQs
  const categories = Array.from(
    new Set(faqs.map((f) => f.category).filter(Boolean)),
  ) as string[];

  // Filtered FAQs
  const filteredFaqs = faqs.filter((f) => {
    if (faqCategoryFilter !== 'ALL' && f.category !== faqCategoryFilter) {
      return false;
    }
    if (faqStatusFilter !== 'ALL' && f.status !== faqStatusFilter) {
      return false;
    }
    if (faqSearch) {
      const q = faqSearch.toLowerCase();
      return (
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        (f.category && f.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filtered Pages
  const filteredPages = pages.filter((p) => {
    if (pageStatusFilter !== 'ALL' && p.status !== pageStatusFilter) {
      return false;
    }
    if (pageSearch) {
      const q = pageSearch.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.pageKey.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // FAQ Handlers
  function openAddFaq() {
    setEditingFaqId(null);
    setFaqFormData({
      category: 'Umum',
      question: '',
      answer: '',
      sortOrder: faqs.length + 1,
      status: 'PUBLISHED',
    });
    setFormErrors({});
    setGeneralError('');
    setIsFaqModalOpen(true);
  }

  function openEditFaq(item: FaqItem) {
    setEditingFaqId(item.id);
    setFaqFormData({
      category: item.category || '',
      question: item.question,
      answer: item.answer,
      sortOrder: item.sortOrder,
      status: item.status,
    });
    setFormErrors({});
    setGeneralError('');
    setIsFaqModalOpen(true);
  }

  async function handleFaqSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});
    setGeneralError('');

    startTransition(async () => {
      try {
        const url = editingFaqId
          ? `/api/admin/faqs/${editingFaqId}`
          : '/api/admin/faqs';
        const method = editingFaqId ? 'PATCH' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(faqFormData),
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.errors) {
            setFormErrors(data.errors);
          } else {
            setGeneralError(data.message || 'Gagal menyimpan FAQ.');
          }
          return;
        }

        if (editingFaqId) {
          setFaqs((prev) =>
            prev.map((it) => (it.id === editingFaqId ? data.data : it)),
          );
          setSuccessMessage('FAQ berhasil diperbarui.');
        } else {
          setFaqs((prev) => [...prev, data.data]);
          setSuccessMessage('FAQ berhasil ditambahkan.');
        }
        setIsFaqModalOpen(false);
      } catch {
        setGeneralError('Terjadi kesalahan jaringan.');
      }
    });
  }

  async function handleDeleteFaq(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus FAQ ini?')) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          alert(data.message || 'Gagal menghapus FAQ.');
          return;
        }
        setFaqs((prev) => prev.filter((it) => it.id !== id));
        setSuccessMessage('FAQ berhasil dihapus.');
      } catch {
        alert('Gagal menghapus FAQ.');
      }
    });
  }

  // Page Handlers
  function openAddPage() {
    setEditingPageKey(null);
    setPageFormData({
      pageKey: '',
      title: '',
      slug: '',
      content: '',
      status: 'PUBLISHED',
      seoTitle: '',
      seoDescription: '',
    });
    setFormErrors({});
    setGeneralError('');
    setIsPageModalOpen(true);
  }

  function openEditPage(item: ContentPageItem) {
    setEditingPageKey(item.pageKey);
    setPageFormData({
      pageKey: item.pageKey,
      title: item.title,
      slug: item.slug,
      content: item.content,
      status: item.status,
      seoTitle: item.seoTitle || '',
      seoDescription: item.seoDescription || '',
    });
    setFormErrors({});
    setGeneralError('');
    setIsPageModalOpen(true);
  }

  async function handlePageSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});
    setGeneralError('');

    startTransition(async () => {
      try {
        const url = editingPageKey
          ? `/api/admin/content-pages/${editingPageKey}`
          : '/api/admin/content-pages';
        const method = editingPageKey ? 'PATCH' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pageFormData),
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.errors) {
            setFormErrors(data.errors);
          } else {
            setGeneralError(data.message || 'Gagal menyimpan halaman.');
          }
          return;
        }

        if (editingPageKey) {
          setPages((prev) =>
            prev.map((it) =>
              it.pageKey === editingPageKey || it.id === data.data.id
                ? data.data
                : it,
            ),
          );
          setSuccessMessage('Halaman berhasil diperbarui.');
        } else {
          setPages((prev) => [data.data, ...prev]);
          setSuccessMessage('Halaman berhasil ditambahkan.');
        }
        setIsPageModalOpen(false);
      } catch {
        setGeneralError('Terjadi kesalahan jaringan.');
      }
    });
  }

  async function handleDeletePage(key: string) {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus halaman "${key}"? Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/content-pages/${key}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.message || 'Gagal menghapus halaman.');
          return;
        }
        setPages((prev) => prev.filter((it) => it.pageKey !== key));
        setSuccessMessage('Halaman berhasil dihapus.');
      } catch {
        alert('Gagal menghapus halaman.');
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Page Heading */}
      <div className="page-heading">
        <p className="section-label">Pengelolaan</p>
        <h1>Konten</h1>
        <p>
          Kelola FAQ (Tanya Jawab) dan Halaman Informasi Publik (Tentang Kami,
          Kebijakan, Syarat & Ketentuan).
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm flex justify-between items-center"
        >
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-900 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-black/10 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('faq')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'faq'
              ? 'border-accent text-accent'
              : 'border-transparent text-foreground/70 hover:text-foreground'
          }`}
        >
          <span>💬 Tanya Jawab (FAQ)</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-black/5">
            {faqs.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pages')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'pages'
              ? 'border-accent text-accent'
              : 'border-transparent text-foreground/70 hover:text-foreground'
          }`}
        >
          <span>📄 Halaman Kebijakan & Info</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-black/5">
            {pages.length}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: FAQ MANAGEMENT */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Cari FAQ..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-black/15 w-full sm:w-64"
              />
              <select
                value={faqCategoryFilter}
                onChange={(e) => setFaqCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-black/15 bg-card"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={faqStatusFilter}
                onChange={(e) => setFaqStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-black/15 bg-card"
              >
                <option value="ALL">Semua Status</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={openAddFaq}
                className="admin-primary w-full sm:w-auto whitespace-nowrap"
              >
                + Tambah FAQ
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-black/10 shadow-xs">
            <table className="admin-table w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/5 text-xs font-semibold uppercase text-foreground/70">
                  <th className="p-3 w-16 text-center">Urutan</th>
                  <th className="p-3">Pertanyaan & Jawaban</th>
                  <th className="p-3 w-32">Kategori</th>
                  <th className="p-3 w-28 text-center">Status</th>
                  <th className="p-3 w-28 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-sm">
                {filteredFaqs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-foreground/60"
                    >
                      Tidak ada FAQ yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredFaqs.map((faq) => (
                    <tr key={faq.id} className="hover:bg-black/[0.02]">
                      <td className="p-3 text-center font-mono text-xs">
                        {faq.sortOrder}
                      </td>
                      <td className="p-3 space-y-1">
                        <div className="font-semibold text-foreground">
                          {faq.question}
                        </div>
                        <div className="text-xs text-foreground/75 line-clamp-2">
                          {faq.answer}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded-md text-xs bg-black/5">
                          {faq.category || 'Umum'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            faq.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : faq.status === 'DRAFT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {faq.status}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {canManage && (
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEditFaq(faq)}
                              className="text-xs font-medium text-accent hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFaq(faq.id)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: CONTENT PAGES MANAGEMENT */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'pages' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Cari Halaman..."
                value={pageSearch}
                onChange={(e) => setPageSearch(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-black/15 w-full sm:w-64"
              />
              <select
                value={pageStatusFilter}
                onChange={(e) => setPageStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-black/15 bg-card"
              >
                <option value="ALL">Semua Status</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={openAddPage}
                className="admin-primary w-full sm:w-auto whitespace-nowrap"
              >
                + Tambah Halaman
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPages.length === 0 ? (
              <div className="col-span-full p-8 text-center text-foreground/60 rounded-xl border border-dashed border-black/15">
                Belum ada halaman konten yang dibuat. Klik tombol{' '}
                <strong>+ Tambah Halaman</strong> untuk mulai membuat halaman
                seperti Tentang Kami, Syarat & Ketentuan, atau Kebijakan
                Privasi.
              </div>
            ) : (
              filteredPages.map((page) => (
                <div
                  key={page.id}
                  className="p-5 rounded-xl border border-black/10 bg-card shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/5 text-foreground/80 font-bold uppercase">
                        {page.pageKey}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          page.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : page.status === 'DRAFT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {page.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground">
                      {page.title}
                    </h3>
                    <p className="text-xs text-foreground/60 font-mono">
                      /{page.slug}
                    </p>

                    <p className="text-xs text-foreground/75 line-clamp-3">
                      {page.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-black/5 flex justify-between items-center text-xs">
                    <span className="text-foreground/50">
                      Update:{' '}
                      {new Date(page.updatedAt).toLocaleDateString('id-ID')}
                    </span>
                    {canManage && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditPage(page)}
                          className="font-medium text-accent hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePage(page.pageKey)}
                          className="font-medium text-red-600 hover:underline"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL / DRAWER: FAQ */}
      {/* ------------------------------------------------------------------ */}
      {isFaqModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-black/10 flex justify-between items-center">
              <h3 className="font-bold text-base">
                {editingFaqId ? 'Edit FAQ' : 'Tambah FAQ Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFaqModalOpen(false)}
                className="text-foreground/60 hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleFaqSubmit}
              className="p-5 overflow-y-auto space-y-4 text-sm"
            >
              {generalError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                  {generalError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold block text-xs">Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: Booking, Pembayaran, Logistik"
                  value={faqFormData.category}
                  onChange={(e) =>
                    setFaqFormData({ ...faqFormData, category: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-black/15"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-xs">
                  Pertanyaan *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Tulis pertanyaan..."
                  value={faqFormData.question}
                  onChange={(e) =>
                    setFaqFormData({ ...faqFormData, question: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-black/15"
                />
                {formErrors.question && (
                  <p className="text-red-600 text-xs">{formErrors.question}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-xs">Jawaban *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tulis jawaban lengkap..."
                  value={faqFormData.answer}
                  onChange={(e) =>
                    setFaqFormData({ ...faqFormData, answer: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-black/15"
                />
                {formErrors.answer && (
                  <p className="text-red-600 text-xs">{formErrors.answer}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold block text-xs">Urutan</label>
                  <input
                    type="number"
                    min={0}
                    value={faqFormData.sortOrder}
                    onChange={(e) =>
                      setFaqFormData({
                        ...faqFormData,
                        sortOrder: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-black/15"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-xs">
                    Status Konten
                  </label>
                  <select
                    value={faqFormData.status}
                    onChange={(e) =>
                      setFaqFormData({
                        ...faqFormData,
                        status: e.target.value as ContentStatus,
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-black/15 bg-card"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-black/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-black/15 hover:bg-black/5 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="admin-primary text-xs"
                >
                  {isPending ? 'Menyimpan...' : 'Simpan FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL / DRAWER: CONTENT PAGE */}
      {/* ------------------------------------------------------------------ */}
      {isPageModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-black/10 flex justify-between items-center">
              <h3 className="font-bold text-base">
                {editingPageKey ? 'Edit Halaman Konten' : 'Tambah Halaman Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPageModalOpen(false)}
                className="text-foreground/60 hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handlePageSubmit}
              className="p-5 overflow-y-auto space-y-4 text-sm"
            >
              {generalError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                  {generalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold block text-xs">
                    Page Key (Kode Unik) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: about, terms, privacy, cancellation"
                    value={pageFormData.pageKey}
                    disabled={!!editingPageKey}
                    onChange={(e) =>
                      setPageFormData({
                        ...pageFormData,
                        pageKey: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-black/15 disabled:bg-black/5 font-mono text-xs"
                  />
                  {formErrors.pageKey && (
                    <p className="text-red-600 text-xs">{formErrors.pageKey}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-xs">
                    Status Halaman
                  </label>
                  <select
                    value={pageFormData.status}
                    onChange={(e) =>
                      setPageFormData({
                        ...pageFormData,
                        status: e.target.value as ContentStatus,
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-black/15 bg-card"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold block text-xs">
                    Judul Halaman *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kebijakan Privasi"
                    value={pageFormData.title}
                    onChange={(e) =>
                      setPageFormData({
                        ...pageFormData,
                        title: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-black/15"
                  />
                  {formErrors.title && (
                    <p className="text-red-600 text-xs">{formErrors.title}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-xs">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: privacy-policy"
                    value={pageFormData.slug}
                    onChange={(e) =>
                      setPageFormData({ ...pageFormData, slug: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-black/15 font-mono text-xs"
                  />
                  {formErrors.slug && (
                    <p className="text-red-600 text-xs">{formErrors.slug}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-xs">
                  Isi Konten (Markdown / Teks) *
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Tulis konten lengkap halaman..."
                  value={pageFormData.content}
                  onChange={(e) =>
                    setPageFormData({
                      ...pageFormData,
                      content: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-black/15 font-mono text-xs"
                />
                {formErrors.content && (
                  <p className="text-red-600 text-xs">{formErrors.content}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold block text-xs">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    placeholder="Judul untuk pencarian Google..."
                    value={pageFormData.seoTitle}
                    onChange={(e) =>
                      setPageFormData({
                        ...pageFormData,
                        seoTitle: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-black/15"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-xs">
                    SEO Description
                  </label>
                  <input
                    type="text"
                    placeholder="Deskripsi ringkas SEO..."
                    value={pageFormData.seoDescription}
                    onChange={(e) =>
                      setPageFormData({
                        ...pageFormData,
                        seoDescription: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-black/15"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-black/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPageModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-black/15 hover:bg-black/5 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="admin-primary text-xs"
                >
                  {isPending ? 'Menyimpan...' : 'Simpan Halaman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
