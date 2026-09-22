'use client';

import { useState } from 'react';
import type { PublicMountainSummary } from '@wildera/types';
import { trackPrivateTripInquiry } from '@/lib/analytics';

interface PrivateTripClientProps {
  mountains: PublicMountainSummary[];
  defaultWhatsappNumber?: string;
}

export function PrivateTripClient({
  mountains,
  defaultWhatsappNumber = '6281234567890',
}: PrivateTripClientProps) {
  const [selectedMountainId, setSelectedMountainId] = useState<string>(
    mountains[0]?.id || '',
  );
  const [isCustomDestination, setIsCustomDestination] =
    useState<boolean>(false);
  const [customDestinationName, setCustomDestinationName] =
    useState<string>('');

  const [preferredDate, setPreferredDate] = useState<string>('');
  const [alternativeDate, setAlternativeDate] = useState<string>('');
  const [participantCount, setParticipantCount] = useState<number>(4);
  const [meetingPoint, setMeetingPoint] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [requirements, setRequirements] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    inquiryNumber: string;
    whatsappUrl: string;
    destinationName: string;
    preferredDate: string;
    participantCount: number;
    customerName: string;
  } | null>(null);

  const handleDestinationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setIsCustomDestination(true);
      setSelectedMountainId('');
    } else {
      setIsCustomDestination(false);
      setSelectedMountainId(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isCustomDestination && !customDestinationName.trim()) {
      setErrorMsg('Silakan tuliskan nama destinasi / gunung tujuan.');
      return;
    }
    if (!isCustomDestination && !selectedMountainId) {
      setErrorMsg('Silakan pilih destinasi / gunung tujuan.');
      return;
    }
    if (!preferredDate) {
      setErrorMsg('Silakan tentukan tanggal rencana keberangkatan.');
      return;
    }
    if (!participantCount || participantCount < 1) {
      setErrorMsg('Jumlah peserta minimal 1 orang.');
      return;
    }
    if (!meetingPoint.trim()) {
      setErrorMsg(
        'Silakan isi lokasi meeting point / penjemputan yang diinginkan.',
      );
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Silakan isi nama lengkap pemesan.');
      return;
    }
    if (!whatsapp.trim()) {
      setErrorMsg('Silakan isi nomor WhatsApp aktif.');
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        mountainId: isCustomDestination ? null : selectedMountainId,
        destinationOther: isCustomDestination
          ? customDestinationName.trim()
          : null,
        destination: isCustomDestination
          ? customDestinationName.trim()
          : mountains.find((m) => m.id === selectedMountainId)?.name ||
            'Gunung',
        preferredDate,
        alternativeDate: alternativeDate || null,
        participantCount: Number(participantCount),
        meetingPointRequest: meetingPoint.trim(),
        customerName: name.trim(),
        whatsappNumber: whatsapp.trim(),
        email: email.trim() || null,
        budget: budget ? Number(budget) : null,
        requirements: requirements.trim() || null,
      };

      const res = await fetch('/api/private-trip-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        const message =
          json.error?.message ||
          (json.error?.errors && Object.values(json.error.errors).join(', ')) ||
          'Gagal mengirimkan permohonan private trip. Silakan coba kembali.';
        setErrorMsg(message);
        return;
      }

      const inquiry = json.inquiry || json.data;
      const targetDestination =
        inquiry?.mountain?.name ||
        inquiry?.destinationOther ||
        payload.destination;

      // Track inquiry event (CRITICAL: zero PII / medical data sent)
      trackPrivateTripInquiry({
        destination: String(targetDestination),
        mountainId:
          typeof payload.mountainId === 'string' ? payload.mountainId : null,
        participantCount: Number(participantCount),
        preferredDate: String(preferredDate),
      });

      setSubmittedData({
        inquiryNumber: inquiry?.inquiryNumber || 'PT-SUBMITTED',
        whatsappUrl:
          json.whatsappUrl ||
          `https://wa.me/${defaultWhatsappNumber.replace(/[^0-9]/g, '')}`,
        destinationName: targetDestination,
        preferredDate,
        participantCount: Number(participantCount),
        customerName: name.trim(),
      });
    } catch {
      setErrorMsg(
        'Terjadi kesalahan koneksi server. Silakan hubungi admin langsung via WhatsApp.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setPreferredDate('');
    setAlternativeDate('');
    setMeetingPoint('');
    setName('');
    setWhatsapp('');
    setEmail('');
    setBudget('');
    setRequirements('');
  };

  if (submittedData) {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-10 shadow-lg text-center max-w-2xl mx-auto animate-fade-in">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold">
          ✓
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
          Permintaan Terkirim
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold mt-3 text-foreground">
          Terima Kasih, {submittedData.customerName}!
        </h2>
        <p className="text-sm sm:text-base text-foreground/75 mt-2 max-w-lg mx-auto">
          Inkuiri private trip kamu telah kami terima dengan nomor registrasi:
        </p>
        <div className="my-5 inline-block bg-muted/70 border border-border px-5 py-2.5 rounded-xl font-mono text-lg font-bold text-primary tracking-wider">
          {submittedData.inquiryNumber}
        </div>

        <div className="bg-background/80 border border-border/60 rounded-xl p-4 sm:p-6 text-left max-w-lg mx-auto mb-8 space-y-2.5 text-sm">
          <div className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-foreground/60">Destinasi</span>
            <span className="font-semibold text-foreground">
              {submittedData.destinationName}
            </span>
          </div>
          <div className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-foreground/60">Rencana Tanggal</span>
            <span className="font-semibold text-foreground">
              {submittedData.preferredDate}
            </span>
          </div>
          <div className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-foreground/60">Jumlah Peserta</span>
            <span className="font-semibold text-foreground">
              {submittedData.participantCount} Orang
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60">Status Tiket</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
              NEW (Menunggu Review)
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <a
            href={submittedData.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors shadow-md"
          >
            <span>💬 Lanjut Konsultasi WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground"
          >
            Buat Inkuiri Lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border/80 rounded-2xl p-6 sm:p-10 shadow-lg space-y-8"
    >
      {errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-destructive font-bold ml-2 hover:opacity-80"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bagian 1: Rencana Perjalanan */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4 pb-2 border-b border-border">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
            1
          </span>
          Detail Perjalanan & Rombongan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Destination */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Destinasi / Gunung Tujuan{' '}
              <span className="text-destructive">*</span>
            </label>
            <select
              value={isCustomDestination ? 'CUSTOM' : selectedMountainId}
              onChange={handleDestinationChange}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {mountains.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.altitudeM} mdpl)
                </option>
              ))}
              <option value="CUSTOM">+ Destinasi / Gunung Lainnya...</option>
            </select>
            {isCustomDestination && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Contoh: Gunung Rinjani via Torean, Gunung Argopuro 5D4N"
                  value={customDestinationName}
                  onChange={(e) => setCustomDestinationName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required={isCustomDestination}
                />
              </div>
            )}
          </div>

          {/* Preferred Date */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Tanggal Keberangkatan <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              name="preferredDate"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Alternative Date */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Tanggal Alternatif{' '}
              <span className="text-foreground/50 text-xs font-normal">
                (Opsional)
              </span>
            </label>
            <input
              type="date"
              name="alternativeDate"
              value={alternativeDate}
              onChange={(e) => setAlternativeDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Participant Count */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Jumlah Peserta <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="participantCount"
                min={1}
                max={500}
                value={participantCount}
                onChange={(e) => setParticipantCount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <span className="absolute right-4 top-2.5 text-sm text-foreground/50 pointer-events-none">
                Orang
              </span>
            </div>
          </div>

          {/* Meeting Point */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Meeting Point / Titik Jemput{' '}
              <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              name="meetingPoint"
              placeholder="Contoh: Bandara Juanda Surabaya / Stasiun Pasar Senen"
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>
      </div>

      {/* Bagian 2: Kontak Pemesan */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4 pb-2 border-b border-border">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
            2
          </span>
          Kontak Penanggung Jawab Rombongan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Nama Lengkap <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Nama penanggung jawab"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Nomor WhatsApp Aktif <span className="text-destructive">*</span>
            </label>
            <input
              type="tel"
              name="whatsapp"
              placeholder="081234567890"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Email */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Email{' '}
              <span className="text-foreground/50 text-xs font-normal">
                (Opsional untuk pengiriman invoice proposal)
              </span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Bagian 3: Preferensi & Kustomisasi Tambahan */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4 pb-2 border-b border-border">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
            3
          </span>
          Preferensi Layanan & Anggaran
        </h3>

        <div className="space-y-5">
          {/* Budget */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Estimasi Budget Rombongan (Rp){' '}
              <span className="text-foreground/50 text-xs font-normal">
                (Opsional)
              </span>
            </label>
            <input
              type="number"
              name="budget"
              placeholder="Contoh: 15000000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Requirements */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Kebutuhan Khusus / Permintaan Khusus{' '}
              <span className="text-foreground/50 text-xs font-normal">
                (Opsional)
              </span>
            </label>
            <textarea
              rows={3}
              name="requirements"
              placeholder="Contoh: Butuh porter pribadi untuk bawa tas anak, makanan pantang udang/seafood, tenda kapasitas 2 orang, atau dokumentasi drone profesional."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-foreground/60 text-center sm:text-left">
          Tim Wildera Adventure akan meninjau dan mengirimkan penawaran dalam
          1x24 jam.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold primary-button text-primary-cta-text disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {loading
            ? 'Mengirimkan Permintaan...'
            : 'Kirim Permintaan Private Trip'}
        </button>
      </div>
    </form>
  );
}
