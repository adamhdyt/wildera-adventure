'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PublicTripDetail } from '@wildera/types';
import { BookingCard, formatDateRange, formatRupiah } from './booking-card';
import { ItineraryTimeline } from './itinerary-timeline';
import {
  buildBookingWhatsAppMessage,
  buildHealthRequirementWhatsAppMessage,
  buildWhatsAppUrl,
  trackWhatsAppClick,
} from '@/lib/whatsapp';
import {
  trackViewTrip,
  trackSelectSchedule,
  trackSelectPackage,
  trackClickBookWhatsApp,
  trackClickHealthWhatsApp,
} from '@/lib/analytics';

interface TripDetailClientProps {
  trip: PublicTripDetail;
  whatsappNumber: string;
}

const DIFFICULTY_MAP: Record<
  string,
  { label: string; badgeBorder: string; dotClass: string; desc: string }
> = {
  EASY: {
    label: 'Santai (Easy)',
    badgeBorder: 'border-emerald-400/40',
    dotClass: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]',
    desc: 'Medan relatif bersahabat dengan elevasi moderat. Cocok untuk pendaki pemula.',
  },
  MODERATE: {
    label: 'Sedang (Moderate)',
    badgeBorder: 'border-sky-400/40',
    dotClass: 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)]',
    desc: 'Membutuhkan stamina kardio yang baik dan daya tahan fisik untuk perjalanan beberapa jam berturut-turut.',
  },
  HARD: {
    label: 'Menantang (Hard)',
    badgeBorder: 'border-amber-400/40',
    dotClass: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]',
    desc: 'Tanjakan terjal berkelanjutan, medan berbatu/berpasir, serta elevasi ekstrem. Memerlukan persiapan fisik intensif.',
  },
  EXTREME: {
    label: 'Ekstrem (Extreme)',
    badgeBorder: 'border-rose-400/40',
    dotClass: 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.9)]',
    desc: 'Medan teknis tingkat tinggi, jurang terbuka, paparan cuaca dingin ekstrem, dan durasi ekspedisi panjang.',
  },
};

export function TripDetailClient({
  trip,
  whatsappNumber,
}: TripDetailClientProps) {
  // First available schedule by default
  const defaultSchedule =
    trip.schedules?.find(
      (s) => s.bookable && s.availabilityStatus !== 'SOLD_OUT',
    ) ||
    trip.schedules?.[0] ||
    null;

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    defaultSchedule ? defaultSchedule.id : null,
  );

  const defaultPackage =
    defaultSchedule?.packages && defaultSchedule.packages.length > 0
      ? defaultSchedule.packages[0]?.id || null
      : null;

  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    defaultPackage,
  );

  const [selectedImage, setSelectedImage] = useState<string>(
    trip.media?.cover?.url ||
      'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80',
  );

  const diffConfig = DIFFICULTY_MAP[trip.difficulty] ?? {
    label: 'Sedang (Moderate)',
    badgeBorder: 'border-sky-400/40',
    dotClass: 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)]',
    desc: 'Membutuhkan stamina kardio yang baik dan daya tahan fisik.',
  };

  useEffect(() => {
    trackViewTrip({
      id: trip.id,
      slug: trip.slug,
      name: trip.name,
      tripType: trip.tripType,
      mountain: { name: trip.mountain.name },
    });
  }, [trip]);

  // Selected schedule object
  const activeSchedule = trip.schedules?.find(
    (s) => s.id === selectedScheduleId,
  );
  const activePackage = activeSchedule?.packages?.find(
    (p) => p.id === selectedPackageId,
  );

  // Price for sticky mobile
  const activePrice = activePackage
    ? formatRupiah(activePackage.price)
    : activeSchedule && activeSchedule.packages?.[0]
      ? formatRupiah(activeSchedule.packages[0].price)
      : 'Mulai ' +
        formatRupiah(trip.schedules?.[0]?.packages?.[0]?.price || 1500000);

  const handleSelectSchedule = (id: string) => {
    setSelectedScheduleId(id);
    const sched = trip.schedules?.find((s) => s.id === id);
    if (sched) {
      trackSelectSchedule(sched, trip.slug);
    }
    if (sched && sched.packages && sched.packages.length > 0) {
      const firstPkg = sched.packages[0];
      setSelectedPackageId(firstPkg?.id || null);
      if (firstPkg) {
        trackSelectPackage(firstPkg, trip.slug);
      }
    } else {
      setSelectedPackageId(null);
    }
  };

  const handleSelectPackage = (id: string) => {
    setSelectedPackageId(id);
    const pkg = activeSchedule?.packages?.find((p) => p.id === id);
    if (pkg) {
      trackSelectPackage(pkg, trip.slug);
    }
  };

  const scrollToBooking = () => {
    const el = document.getElementById('booking-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* 1. Hero & Breadcrumbs Section */}
      <section
        aria-label="Trip Hero"
        data-testid="trip-hero"
        className="w-full bg-black/95 text-white pt-28 pb-12 md:pt-36 md:pb-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-white/70"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <Link href="/trip" className="hover:text-white transition-colors">
              Explore Trip
            </Link>
            <span>/</span>
            <span className="text-white font-semibold truncate max-w-xs sm:max-w-md">
              {trip.name}
            </span>
          </nav>

          {/* Title & Key Badges */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-accent text-white">
                {trip.tripType === 'OPEN_TRIP' ? 'Open Trip' : 'Private Trip'}
              </span>
              <span
                className={`px-2.5 py-1 rounded text-xs font-semibold border backdrop-blur-md flex items-center gap-1.5 bg-black/75 text-white ${diffConfig.badgeBorder}`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${diffConfig.dotClass}`}
                />
                <span>{diffConfig.label}</span>
              </span>
              {trip.beginnerFriendly && (
                <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ramah Pemula
                </span>
              )}
            </div>

            <h1
              data-testid="trip-title"
              className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight"
            >
              {trip.name}
            </h1>

            {/* Subtitle / Mountain & Route */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>
                  Gunung {trip.mountain.name}
                  {trip.route ? ` via ${trip.route.name}` : ''}
                </span>
              </span>

              <span>•</span>
              <span>{trip.mountain.destination.name}</span>
              <span>•</span>
              <span className="font-mono">
                {trip.mountain.altitudeM.toLocaleString('id-ID')} mdpl
              </span>
              <span>•</span>
              <span>
                {trip.duration.days}D{trip.duration.nights}N
              </span>
            </div>
          </div>

          {/* Hero Gallery Component */}
          <div className="flex flex-col gap-3 mt-2">
            {/* Main Active Image */}
            <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded overflow-hidden bg-black/60 border border-white/10 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt={trip.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Gallery Thumbnails Strip */}
            {trip.media?.gallery && trip.media.gallery.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImage(trip.media?.cover?.url || selectedImage)
                  }
                  className={`relative w-20 h-14 rounded overflow-hidden shrink-0 border-2 transition-all ${
                    selectedImage === trip.media?.cover?.url
                      ? 'border-accent scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={trip.media?.cover?.url}
                    alt={trip.media?.cover?.alt || `Foto cover ${trip.name}`}
                    className="w-full h-full object-cover"
                  />
                </button>
                {trip.media.gallery.map((g, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(g.url)}
                    className={`relative w-20 h-14 rounded overflow-hidden shrink-0 border-2 transition-all ${
                      selectedImage === g.url
                        ? 'border-accent scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.url}
                      alt={g.alt || `Dokumentasi ${trip.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Main Content & Sticky Booking Layout */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left Column: Extensive Trip Details (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-14">
            {/* Section A: Trip Summary Metrics */}
            <section
              aria-label="Trip Summary"
              data-testid="trip-summary-section"
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded card border border-border/40"
            >
              <div>
                <span className="block text-[11px] text-muted-foreground uppercase tracking-wider">
                  Durasi
                </span>
                <strong className="text-sm sm:text-base font-serif text-foreground">
                  {trip.duration.days} Hari {trip.duration.nights} Malam
                </strong>
              </div>

              <div>
                <span className="block text-[11px] text-muted-foreground uppercase tracking-wider">
                  Elevasi Puncak
                </span>
                <strong className="text-sm sm:text-base font-mono text-foreground">
                  {trip.mountain.altitudeM.toLocaleString('id-ID')} mdpl
                </strong>
              </div>

              <div>
                <span className="block text-[11px] text-muted-foreground uppercase tracking-wider">
                  Batasan Usia
                </span>
                <strong className="text-sm sm:text-base text-foreground">
                  {trip.minimumAge ? `${trip.minimumAge} th` : '12 th'} –{' '}
                  {trip.maximumAge ? `${trip.maximumAge} th` : '55 th'}
                </strong>
              </div>

              <div>
                <span className="block text-[11px] text-muted-foreground uppercase tracking-wider">
                  Surat Kesehatan
                </span>
                <strong
                  className={`text-xs sm:text-sm font-semibold ${
                    trip.healthCertificateRequired
                      ? 'text-amber-600'
                      : 'text-foreground'
                  }`}
                >
                  {trip.healthCertificateRequired ? 'Wajib Dokter' : 'Opsional'}
                </strong>
              </div>
            </section>

            {/* Section B: Overview & Deskripsi */}
            <section
              aria-label="Overview"
              data-testid="trip-overview-section"
              className="flex flex-col gap-4"
            >
              <h2 className="text-2xl font-serif font-bold text-foreground">
                Tentang Perjalanan
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {trip.description ||
                  trip.shortDescription ||
                  `Ekspedisi pendakian Gunung ${trip.mountain.name} bersama tim profesional Wildera Adventure. Menghadirkan keseimbangan sempurna antara petualangan alpine otentik, standar keselamatan medis ketat, dan logistik camp premium.`}
              </p>
            </section>

            {/* Section C: Itinerary Timeline */}
            <section
              aria-label="Itinerary"
              data-testid="trip-itinerary-section"
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Rencana Ekspedisi
                </span>
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  Itinerary Harian
                </h2>
              </div>

              {trip.itinerary && trip.itinerary.length > 0 ? (
                <ItineraryTimeline itineraries={trip.itinerary} />
              ) : (
                <div className="card p-5 rounded border border-border/40 text-xs text-muted-foreground">
                  Jadwal rundown harian sedang dalam finalisasi oleh tim guide.
                </div>
              )}
            </section>

            {/* Section D: Include & Exclude */}
            <section
              aria-label="Fasilitas"
              data-testid="trip-facilities-section"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Include */}
              <div className="p-6 rounded card border border-border/40 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-emerald-600 font-serif font-bold text-lg">
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <h3>Sudah Termasuk (Include)</h3>
                </div>
                <ul className="flex flex-col gap-2.5 text-xs sm:text-sm text-muted-foreground">
                  {trip.includes && trip.includes.length > 0 ? (
                    trip.includes.map((inc) => (
                      <li key={inc.id} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <div>
                          <strong className="text-foreground">
                            {inc.item}
                          </strong>
                          {inc.description && (
                            <span className="block text-xs text-muted-foreground">
                              {inc.description}
                            </span>
                          )}
                        </div>
                      </li>
                    ))
                  ) : (
                    <>
                      <li>• Mountain Guide bersertifikat APGI</li>
                      <li>• Tenda dome kapasitas 2-3 orang & matras empuk</li>
                      <li>• Makan bernutrisi selama durasi ekspedisi</li>
                      <li>• Tiket masuk TN & asuransi resmi</li>
                      <li>• Tim Porter perlengkapan kelompok & logistik</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Exclude */}
              <div className="p-6 rounded card border border-border/40 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-red-600 font-serif font-bold text-lg">
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <h3>Tidak Termasuk (Exclude)</h3>
                </div>
                <ul className="flex flex-col gap-2.5 text-xs sm:text-sm text-muted-foreground">
                  {trip.excludes && trip.excludes.length > 0 ? (
                    trip.excludes.map((exc) => (
                      <li key={exc.id} className="flex items-start gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <div>
                          <strong className="text-foreground">
                            {exc.item}
                          </strong>
                          {exc.description && (
                            <span className="block text-xs text-muted-foreground">
                              {exc.description}
                            </span>
                          )}
                        </div>
                      </li>
                    ))
                  ) : (
                    <>
                      <li>
                        • Tiket perjalanan dari kota asal ke meeting point
                      </li>
                      <li>• Perlengkapan pakaian & sleeping bag pribadi</li>
                      <li>• Porter pribadi (dapat di-request tambahan)</li>
                      <li>• Pengeluaran pribadi & tip kru sukarela</li>
                    </>
                  )}
                </ul>
              </div>
            </section>

            {/* Section E: Meeting Point */}
            <section
              aria-label="Meeting Point"
              data-testid="trip-meeting-point-section"
              className="flex flex-col gap-4 card p-6 rounded border border-border/40"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Titik Kumpul
                </span>
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  Lokasi Pertemuan & Penjemputan
                </h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Setiap paket memiliki meeting point resmi yang telah ditentukan.
                Pastikan tiba minimal 30 menit sebelum jadwal keberangkatan
                briefing dimulai.
              </p>
              {activePackage?.meetingPoint && (
                <div className="p-4 rounded bg-background border border-border flex flex-col gap-1 text-xs sm:text-sm">
                  <div className="font-semibold text-foreground">
                    {activePackage.meetingPoint.name}
                  </div>
                  <div className="text-muted-foreground">
                    {activePackage.meetingPoint.address ||
                      activePackage.meetingPoint.city}
                  </div>
                </div>
              )}
            </section>

            {/* Section F: Gear Checklist */}
            <section
              aria-label="Gear Checklist"
              data-testid="trip-gear-section"
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Checklist Peralatan
                </span>
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  Perlengkapan Pendakian
                </h2>
                <p className="text-sm text-muted-foreground">
                  Kenyamanan dan keselamatan pendakian ditentukan oleh
                  kelengkapan peralatan pribadimu.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Wajib */}
                <div className="card p-5 rounded border border-border/40 flex flex-col gap-3">
                  <h4 className="font-serif font-bold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Perlengkapan Wajib</span>
                  </h4>
                  <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                    {trip.mandatoryGear && trip.mandatoryGear.length > 0 ? (
                      trip.mandatoryGear.map((g) => (
                        <li
                          key={g.id}
                          className="flex justify-between py-1 border-b border-border/20"
                        >
                          <strong className="text-foreground">
                            {g.gearName}
                          </strong>
                          <span>{g.specification || 'Standar Gunung'}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex justify-between py-1 border-b border-border/20">
                          <strong>Sepatu Trekking</strong>
                          <span>Sol grip bergerigi</span>
                        </li>
                        <li className="flex justify-between py-1 border-b border-border/20">
                          <strong>Jaket Windproof & Fleece</strong>
                          <span>Suhu sub-zero 5°C</span>
                        </li>
                        <li className="flex justify-between py-1 border-b border-border/20">
                          <strong>Headlamp</strong>
                          <span>Baterai cadangan</span>
                        </li>
                        <li className="flex justify-between py-1 border-b border-border/20">
                          <strong>Jas Hujan (Ponco/Setelan)</strong>
                          <span>Bahan tahan robek</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Disarankan */}
                <div className="card p-5 rounded border border-border/40 flex flex-col gap-3">
                  <h4 className="font-serif font-bold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Perlengkapan Rekomendasi</span>
                  </h4>
                  <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                    {trip.recommendedGear && trip.recommendedGear.length > 0 ? (
                      trip.recommendedGear.map((g) => (
                        <li
                          key={g.id}
                          className="flex justify-between py-1 border-b border-border/20"
                        >
                          <strong className="text-foreground">
                            {g.gearName}
                          </strong>
                          <span>{g.specification || 'Opsional'}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex justify-between py-1 border-b border-border/20">
                          <strong>Trekking Pole</strong>
                          <span>Meredam beban lutut</span>
                        </li>
                        <li className="flex justify-between py-1 border-b border-border/20">
                          <strong>Gaiter Kaki</strong>
                          <span>Mencegah pasir/kerikil masuk</span>
                        </li>
                        <li className="flex justify-between py-1 border-b border-border/20">
                          <strong>Powerbank</strong>
                          <span>Kapasitas 10.000–20.000 mAh</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </section>

            {/* Section G: Health Requirement & Difficulty */}
            <section
              aria-label="Health & Difficulty"
              data-testid="trip-health-difficulty-section"
              className="card p-6 sm:p-8 rounded border border-border/40 flex flex-col gap-5 bg-muted/20"
            >
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Kebugaran & Keselamatan
                </span>
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  Persyaratan Kesehatan & Fisik
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-muted-foreground">
                <div className="flex flex-col gap-2">
                  <strong className="text-foreground">
                    Surat Keterangan Sehat
                  </strong>
                  <p>
                    {trip.healthCertificateRequired
                      ? 'Peserta wajib menyerahkan Surat Keterangan Sehat resmi dari dokter/klinik bertanggal maksimal H-3 sebelum jadwal keberangkatan.'
                      : 'Meskipun tidak diwajibkan surat dokter, peserta harus memastikan diri bebas riwayat penyakit jantung, asma akut, atau epilepsi.'}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <strong className="text-foreground">
                    Latihan Fisik Sebelum Berangkat
                  </strong>
                  <p>
                    Disarankan melakukan latihan jogging 30 menit atau
                    naik-turun tangga 3 kali seminggu selama minimal 2 pekan
                    sebelum keberangkatan untuk melatih kapasitas
                    kardiorespirasi.
                  </p>
                </div>
              </div>

              {trip.healthCertificateRequired && (
                <div className="mt-2 p-4 rounded bg-card border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Surat Kesehatan
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Trip ini membutuhkan surat keterangan sehat. Belum punya?
                      Admin Wildera dapat membantu memberikan informasi proses
                      yang diperlukan.
                    </p>
                  </div>
                  <a
                    href={buildWhatsAppUrl(
                      whatsappNumber,
                      buildHealthRequirementWhatsAppMessage(trip.name),
                    )}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      trackClickHealthWhatsApp({
                        tripSlug: trip.slug,
                        mountainName: trip.mountain.name,
                      });
                      trackWhatsAppClick('click_health_whatsapp', {
                        trip_name: trip.name,
                        source: 'health_requirement_section',
                      });
                    }}
                    data-testid="health-whatsapp-cta"
                    className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2 rounded bg-emerald-700/15 hover:bg-emerald-700/25 text-emerald-800 text-xs font-semibold border border-emerald-700/30 transition-colors"
                  >
                    Hubungi Admin via WhatsApp
                  </a>
                </div>
              )}
            </section>

            {/* Section H: FAQ Accordion */}
            <section
              aria-label="FAQ"
              data-testid="trip-faq-section"
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Tanya Jawab
                </span>
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {trip.faqs && trip.faqs.length > 0 ? (
                  trip.faqs.map((f) => (
                    <details
                      key={f.id}
                      className="card rounded border border-border/40 p-4 group"
                    >
                      <summary className="font-serif font-bold text-foreground text-sm sm:text-base cursor-pointer list-none flex items-center justify-between">
                        <span>{f.question}</span>
                        <span className="text-accent group-open:rotate-180 transition-transform">
                          ▼
                        </span>
                      </summary>
                      <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {f.answer}
                      </p>
                    </details>
                  ))
                ) : (
                  <>
                    <details className="card rounded border border-border/40 p-4 group">
                      <summary className="font-serif font-bold text-foreground text-sm sm:text-base cursor-pointer list-none flex items-center justify-between">
                        <span>Bagaimana jika cuaca buruk atau badai?</span>
                        <span className="text-accent group-open:rotate-180 transition-transform">
                          ▼
                        </span>
                      </summary>
                      <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Keselamatan adalah prioritas nomor satu. Mountain Guide
                        berhak memutuskan evakuasi atau penundaan summit push
                        sesuai protokol SOP cuaca ekstrem.
                      </p>
                    </details>
                    <details className="card rounded border border-border/40 p-4 group">
                      <summary className="font-serif font-bold text-foreground text-sm sm:text-base cursor-pointer list-none flex items-center justify-between">
                        <span>Apakah boleh membawa makanan sendiri?</span>
                        <span className="text-accent group-open:rotate-180 transition-transform">
                          ▼
                        </span>
                      </summary>
                      <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Sangat diperbolehkan. Tim Wildera menyediakan makanan
                        lengkap bernutrisi, namun camilan favorit atau energi
                        bar pribadi sangat disarankan untuk dibawa.
                      </p>
                    </details>
                  </>
                )}
              </div>
            </section>

            {/* Section I: Policies Summary */}
            <section
              aria-label="Kebijakan"
              data-testid="trip-policies-section"
              className="card p-6 rounded border border-border/40 flex flex-col gap-4 text-xs sm:text-sm text-muted-foreground"
            >
              <h3 className="text-lg font-serif font-bold text-foreground">
                Kebijakan Pembatalan & Reservasi
              </h3>
              <p>
                Pembatalan lebih dari H-14 keberangkatan berhak menerima refund
                sebesar 70% atau pemindahan jadwal (reschedule) satu kali tanpa
                biaya tambahan. Pembatalan H-7 ke bawah menyebabkan DP hangus
                karena alokasi logistik dan izin simaksi telah diterbitkan.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 border-t border-border/30 text-xs">
                <Link href="/terms" className="text-accent hover:underline">
                  Syarat & Ketentuan Lengkap &rarr;
                </Link>
                <Link
                  href="/cancellation"
                  className="text-accent hover:underline"
                >
                  Kebijakan Pembatalan &rarr;
                </Link>
                <Link href="/safety" className="text-accent hover:underline">
                  Protokol Keselamatan &rarr;
                </Link>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Booking Card (Desktop) */}
          <div
            id="booking-section"
            className="lg:col-span-1 lg:sticky lg:top-28 z-20"
          >
            <BookingCard
              schedules={trip.schedules}
              tripName={trip.name}
              mountainName={trip.mountain.name}
              whatsappNumber={whatsappNumber}
              selectedScheduleId={selectedScheduleId}
              selectedPackageId={selectedPackageId}
              onSelectSchedule={handleSelectSchedule}
              onSelectPackage={handleSelectPackage}
            />
          </div>
        </div>
      </main>

      {/* 3. Mobile Sticky Bottom CTA Bar (per UX §33 & §120) */}
      <aside
        aria-label="Mobile Sticky Booking CTA"
        data-testid="mobile-sticky-cta"
        className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border p-4 flex items-center justify-between lg:hidden shadow-lg"
      >
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Total Mulai
          </span>
          <strong
            data-testid="mobile-sticky-price"
            className="text-base font-bold font-mono text-accent"
          >
            {activePrice}
          </strong>
        </div>

        {activeSchedule && activePackage ? (
          <a
            href={buildWhatsAppUrl(
              whatsappNumber,
              buildBookingWhatsAppMessage({
                tripName: trip.name,
                scheduleDates: formatDateRange(
                  activeSchedule.startDate,
                  activeSchedule.endDate,
                ),
                packageName: activePackage.name,
                priceFormatted: formatRupiah(activePackage.price),
              }),
            )}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              trackClickBookWhatsApp({
                tripSlug: trip.slug,
                scheduleId: activeSchedule.id,
                packageId: activePackage.id,
                price: activePackage.price,
              });
              trackWhatsAppClick('click_book_whatsapp', {
                trip_name: trip.name,
                schedule_id: activeSchedule.id,
                schedule_date: formatDateRange(
                  activeSchedule.startDate,
                  activeSchedule.endDate,
                ),
                package_id: activePackage.id,
                package_name: activePackage.name,
                source: 'mobile_sticky_bar',
              });
            }}
            className="px-5 py-2.5 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow"
          >
            <span>Book via WA</span>
            <span>&rarr;</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={scrollToBooking}
            className="px-5 py-2.5 rounded bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors flex items-center gap-1.5 shadow"
          >
            <span>Pilih Jadwal</span>
            <span>&uarr;</span>
          </button>
        )}
      </aside>
    </div>
  );
}
