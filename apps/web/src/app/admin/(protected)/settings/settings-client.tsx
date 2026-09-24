'use client';

import React, { useState } from 'react';

interface SettingsData {
  business_whatsapp: string;
  instagram_url: string;
  contact_email: string;
  almost_full_percentage: number;
}

interface SettingsClientProps {
  initialSettings: SettingsData;
  canManage: boolean;
  userRoles: string[];
}

export function SettingsClient({
  initialSettings,
  canManage,
  userRoles,
}: SettingsClientProps) {
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate WhatsApp
    const waClean = settings.business_whatsapp.replace(/\D/g, '');
    if (waClean.length < 9 || waClean.length > 16) {
      errors.business_whatsapp =
        'Nomor WhatsApp harus terdiri dari 9 hingga 16 digit angka.';
    }

    // Validate Instagram URL
    if (
      !settings.instagram_url.startsWith('http://') &&
      !settings.instagram_url.startsWith('https://')
    ) {
      errors.instagram_url =
        'URL Instagram harus diawali http:// atau https://';
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.contact_email.trim())) {
      errors.contact_email = 'Format email kontak tidak valid.';
    }

    // Validate Almost Full Percentage
    const pct = Number(settings.almost_full_percentage);
    if (!Number.isInteger(pct) || pct < 1 || pct > 100) {
      errors.almost_full_percentage =
        'Persentase hampir penuh harus berupa angka antara 1 dan 100.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    setSuccessMessage(null);
    setErrorMessage(null);

    if (!validateForm()) {
      setErrorMessage('Mohon perbaiki kesalahan isian formulir.');
      return;
    }

    setLoading(true);

    try {
      // Update each key via BFF
      const updates = [
        { key: 'business_whatsapp', value: settings.business_whatsapp },
        {
          key: 'instagram_url',
          settingsValue: settings.instagram_url,
          value: settings.instagram_url,
        },
        { key: 'contact_email', value: settings.contact_email },
        {
          key: 'almost_full_percentage',
          value: Number(settings.almost_full_percentage),
        },
      ];

      for (const item of updates) {
        const res = await fetch(`/api/admin/site-settings/${item.key}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: item.value }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error?.message ||
              body.message ||
              `Gagal menyimpan pengaturan ${item.key}`,
          );
        }
      }

      setSuccessMessage('Pengaturan website berhasil diperbarui.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Terjadi kesalahan sistem.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-content-wrapper space-y-6">
      {/* Header */}
      <div className="page-heading">
        <p className="section-label">Pengelolaan</p>
        <h1>Pengaturan</h1>
        <p>Informasi bisnis dan preferensi website.</p>
      </div>

      {/* Permission alert for non-superadmins */}
      {!canManage && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-sm flex items-start gap-3"
        >
          <span className="text-lg">🔒</span>
          <div>
            <p className="font-semibold">Mode Baca (Read-Only)</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Akun Anda memiliki role ({userRoles.join(', ')}). Hanya Super
              Admin yang diberikan hak akses untuk mengubah konfigurasi
              pengaturan website.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-sm flex items-center justify-between"
        >
          <span>✓ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold underline text-emerald-800"
          >
            Tutup
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-900 text-sm flex items-center justify-between"
        >
          <span>✕ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold underline text-red-800"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Kontak & WhatsApp */}
        <section className="admin-card p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-base font-bold text-stone-900">
              Kontak Resmi & WhatsApp Conversion
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Nomor WhatsApp dan email yang digunakan untuk komunikasi pelanggan
              dan deep-link.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="business_whatsapp"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Nomor WhatsApp Bisnis
              </label>
              <input
                id="business_whatsapp"
                type="text"
                disabled={!canManage || loading}
                value={settings.business_whatsapp}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    business_whatsapp: e.target.value,
                  })
                }
                placeholder="6281234567890"
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#10254d] disabled:bg-stone-100 disabled:text-stone-500"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Format: 628... Digunakan untuk seluruh tombol WhatsApp di
                katalog dan detail trip.
              </p>
              {fieldErrors.business_whatsapp && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.business_whatsapp}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="contact_email"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Email Kontak Resmi
              </label>
              <input
                id="contact_email"
                type="email"
                disabled={!canManage || loading}
                value={settings.contact_email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    contact_email: e.target.value,
                  })
                }
                placeholder="info@wildera.id"
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#10254d] disabled:bg-stone-100 disabled:text-stone-500"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Ditampilkan pada footer dan korespondensi resmi customer
                service.
              </p>
              {fieldErrors.contact_email && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.contact_email}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Card 2: Media Sosial */}
        <section className="admin-card p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-base font-bold text-stone-900">
              Media Sosial & Tautan Luar
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Akun media sosial resmi yang terhubung dengan footer website.
            </p>
          </div>

          <div>
            <label
              htmlFor="instagram_url"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              URL Profil Instagram
            </label>
            <input
              id="instagram_url"
              type="url"
              disabled={!canManage || loading}
              value={settings.instagram_url}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  instagram_url: e.target.value,
                })
              }
              placeholder="https://instagram.com/wildera.adventure"
              className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#10254d] disabled:bg-stone-100 disabled:text-stone-500"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Contoh: https://instagram.com/wildera.adventure
            </p>
            {fieldErrors.instagram_url && (
              <p className="text-xs text-red-600 mt-1">
                {fieldErrors.instagram_url}
              </p>
            )}
          </div>
        </section>

        {/* Card 3: Ambang Batas Kapasitas */}
        <section className="admin-card p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-base font-bold text-stone-900">
              Logika Ketersediaan & Ambang Batas Kuota
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Parameter otomatis untuk menandai jadwal trip yang kuotanya
              menipis.
            </p>
          </div>

          <div className="max-w-md">
            <label
              htmlFor="almost_full_percentage"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Persentase Status &quot;Hampir Penuh&quot; (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                id="almost_full_percentage"
                type="number"
                min={1}
                max={100}
                disabled={!canManage || loading}
                value={settings.almost_full_percentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    almost_full_percentage: Number(e.target.value),
                  })
                }
                placeholder="20"
                className="w-28 px-3.5 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#10254d] disabled:bg-stone-100 disabled:text-stone-500"
              />
              <span className="text-sm font-semibold text-stone-600">%</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Jika sisa kursi ≤ persentase ini dari total kuota, jadwal akan
              berstatus ALMOST_FULL.
            </p>
            {fieldErrors.almost_full_percentage && (
              <p className="text-xs text-red-600 mt-1">
                {fieldErrors.almost_full_percentage}
              </p>
            )}
          </div>
        </section>

        {/* Card 4: Security Information */}
        <section className="p-4 rounded-xl border border-stone-200 bg-stone-50 text-stone-600 text-xs flex items-start gap-3">
          <span className="text-base">🛡️</span>
          <div>
            <p className="font-semibold text-stone-800">
              Standar Keamanan Konfigurasi
            </p>
            <p className="mt-0.5 leading-relaxed text-stone-600">
              Pengaturan ini hanya mengelola informasi publik dan preferensi
              operasional. Sesuai arsitektur keamanan Wildera, database
              connection strings, JWT/session secrets, dan credentials storage
              tidak boleh disimpan pada tabel pengaturan.
            </p>
          </div>
        </section>

        {/* Submit Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!canManage || loading}
            className="px-6 py-2.5 bg-[#10254d] hover:bg-[#0a1833] disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
}
