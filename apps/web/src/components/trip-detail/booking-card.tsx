'use client';

import { useMemo } from 'react';
import type { PublicTripSchedule } from '@wildera/types';
import {
  buildBookingWhatsAppMessage,
  buildWhatsAppUrl,
  trackWhatsAppClick,
} from '@/lib/whatsapp';
import { trackClickBookWhatsApp } from '@/lib/analytics';

interface BookingCardProps {
  schedules: PublicTripSchedule[];
  tripName: string;
  mountainName: string;
  whatsappNumber: string;
  selectedScheduleId: string | null;
  selectedPackageId: string | null;
  onSelectSchedule: (id: string) => void;
  onSelectPackage: (id: string) => void;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateRange(startStr: string, endStr: string): string {
  try {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const startDay = s.getUTCDate();
    const endDay = e.getUTCDate();
    const monthStr = s.toLocaleDateString('id-ID', {
      month: 'short',
      timeZone: 'UTC',
    });
    const year = s.getUTCFullYear();
    return `${startDay}–${endDay} ${monthStr} ${year}`;
  } catch {
    return `${startStr} – ${endStr}`;
  }
}

export function BookingCard({
  schedules,
  tripName,
  mountainName,
  whatsappNumber,
  selectedScheduleId,
  selectedPackageId,
  onSelectSchedule,
  onSelectPackage,
}: BookingCardProps) {
  // Find currently selected schedule
  const selectedSchedule = useMemo(() => {
    return schedules.find((s) => s.id === selectedScheduleId) || null;
  }, [schedules, selectedScheduleId]);

  // Find currently selected package
  const selectedPackage = useMemo(() => {
    if (!selectedSchedule) return null;
    return (
      selectedSchedule.packages.find((p) => p.id === selectedPackageId) || null
    );
  }, [selectedSchedule, selectedPackageId]);

  // Compute display price
  const displayPrice = useMemo(() => {
    if (selectedPackage) {
      return formatRupiah(selectedPackage.price);
    }
    if (selectedSchedule && selectedSchedule.packages.length > 0) {
      const minPrice = Math.min(
        ...selectedSchedule.packages.map((p) => p.price),
      );
      return `Mulai ${formatRupiah(minPrice)}`;
    }
    // Overall minimum from all schedules
    const allPrices: number[] = [];
    schedules.forEach((s) => {
      s.packages.forEach((p) => allPrices.push(p.price));
    });
    if (allPrices.length > 0) {
      return `Mulai ${formatRupiah(Math.min(...allPrices))}`;
    }
    return 'Hubungi Kami';
  }, [selectedPackage, selectedSchedule, schedules]);

  // Construct WhatsApp URL
  const whatsappUrl = useMemo(() => {
    if (!selectedSchedule || !selectedPackage) {
      return buildWhatsAppUrl(
        whatsappNumber,
        `Halo Wildera Adventure, saya tertarik dengan ${tripName}. Mohon info ketersediaan jadwalnya.`,
      );
    }

    const scheduleDate = formatDateRange(
      selectedSchedule.startDate,
      selectedSchedule.endDate,
    );
    const message = buildBookingWhatsAppMessage({
      tripName,
      scheduleDates: scheduleDate,
      packageName: selectedPackage.name,
      priceFormatted: formatRupiah(selectedPackage.price),
    });

    return buildWhatsAppUrl(whatsappNumber, message);
  }, [selectedSchedule, selectedPackage, tripName, whatsappNumber]);

  const handleBookingClick = () => {
    if (selectedSchedule && selectedPackage) {
      trackClickBookWhatsApp({
        tripSlug: tripName,
        scheduleId: selectedSchedule.id,
        packageId: selectedPackage.id,
        price: selectedPackage.price,
      });
      trackWhatsAppClick('click_book_whatsapp', {
        trip_name: `${tripName} (${mountainName})`,
        schedule_id: selectedSchedule.id,
        schedule_date: formatDateRange(
          selectedSchedule.startDate,
          selectedSchedule.endDate,
        ),
        package_id: selectedPackage.id,
        package_name: selectedPackage.name,
        source: 'desktop_booking_card',
      });
    }
  };

  // Booking CTA State per UX Section 37
  let ctaState: 'NO_SCHEDULE' | 'NO_PACKAGE' | 'READY' | 'SOLD_OUT' =
    'NO_SCHEDULE';
  if (selectedSchedule) {
    if (
      selectedSchedule.availabilityStatus === 'SOLD_OUT' ||
      !selectedSchedule.bookable
    ) {
      ctaState = 'SOLD_OUT';
    } else if (!selectedPackage) {
      ctaState = 'NO_PACKAGE';
    } else {
      ctaState = 'READY';
    }
  }

  return (
    <div
      aria-label="Booking Card"
      data-testid="booking-card"
      className="card rounded p-6 border border-border/50 shadow-md flex flex-col gap-6"
    >
      {/* Price Header */}
      <div className="flex flex-col gap-1 pb-4 border-b border-border/40">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Harga per Peserta
        </span>
        <div className="flex items-baseline gap-2">
          <strong
            data-testid="booking-card-price"
            className="text-2xl sm:text-3xl font-bold font-mono text-accent"
          >
            {displayPrice}
          </strong>
        </div>
        {selectedSchedule && (
          <div className="mt-1 flex items-center gap-2">
            <span
              data-testid="booking-card-seats"
              className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                selectedSchedule.availabilityStatus === 'SOLD_OUT'
                  ? 'bg-red-500/10 text-red-700 border-red-500/20'
                  : selectedSchedule.availabilityStatus === 'ALMOST_FULL'
                    ? 'bg-orange-500/10 text-orange-700 border-orange-500/20'
                    : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
              }`}
            >
              {selectedSchedule.availabilityStatus === 'SOLD_OUT'
                ? 'Sold Out'
                : selectedSchedule.availabilityStatus === 'ALMOST_FULL'
                  ? `Tersisa ${selectedSchedule.availableSeats} seat`
                  : `${selectedSchedule.availableSeats} seat tersedia`}
            </span>
          </div>
        )}
      </div>

      {/* 1. Schedule Selector */}
      <div className="flex flex-col gap-3">
        <label
          htmlFor="schedule-selector"
          className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between"
        >
          <span>1. Pilih Tanggal Keberangkatan</span>
          <span className="text-[11px] text-muted-foreground font-normal">
            ({schedules.length} Jadwal)
          </span>
        </label>

        {schedules.length > 0 ? (
          <div
            id="schedule-selector"
            data-testid="schedule-selector"
            className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1"
          >
            {schedules.map((schedule) => {
              const isSelected = schedule.id === selectedScheduleId;
              const isSoldOut =
                schedule.availabilityStatus === 'SOLD_OUT' ||
                !schedule.bookable;

              return (
                <button
                  key={schedule.id}
                  type="button"
                  data-testid={`schedule-option-${schedule.id}`}
                  disabled={isSoldOut}
                  onClick={() => onSelectSchedule(schedule.id)}
                  className={`w-full text-left p-3 rounded border transition-all flex items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? 'border-accent bg-accent/10 text-foreground font-semibold shadow-sm'
                      : isSoldOut
                        ? 'border-border/20 bg-muted/40 text-muted-foreground opacity-60 cursor-not-allowed'
                        : 'border-border/40 hover:border-border hover:bg-muted/10 text-foreground'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">
                      {formatDateRange(schedule.startDate, schedule.endDate)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Batas Daftar:{' '}
                      {schedule.registrationDeadline
                        ? new Date(
                            schedule.registrationDeadline,
                          ).toLocaleDateString('id-ID')
                        : 'H-3'}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 border ${
                      isSoldOut
                        ? 'bg-red-500/10 text-red-600 border-red-500/20'
                        : schedule.availabilityStatus === 'ALMOST_FULL'
                          ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    }`}
                  >
                    {isSoldOut ? 'Sold Out' : `${schedule.availableSeats} seat`}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3 text-xs text-muted-foreground rounded bg-muted/30 border border-border/30">
            Belum ada jadwal keberangkatan aktif.
          </div>
        )}
      </div>

      {/* 2. Package Selector (Enabled when schedule is selected) */}
      <div className="flex flex-col gap-3">
        <label
          htmlFor="package-selector"
          className="text-xs font-semibold text-foreground uppercase tracking-wider"
        >
          2. Pilih Paket & Meeting Point
        </label>

        {selectedSchedule && selectedSchedule.packages.length > 0 ? (
          <div
            id="package-selector"
            data-testid="package-selector"
            className="flex flex-col gap-2"
          >
            {selectedSchedule.packages.map((pkg) => {
              const isSelected = pkg.id === selectedPackageId;

              return (
                <button
                  key={pkg.id}
                  type="button"
                  data-testid={`package-option-${pkg.id}`}
                  onClick={() => onSelectPackage(pkg.id)}
                  className={`w-full text-left p-3 rounded border transition-all flex flex-col gap-1 text-xs ${
                    isSelected
                      ? 'border-accent bg-accent/10 text-foreground font-semibold shadow-sm'
                      : 'border-border/40 hover:border-border hover:bg-muted/10 text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{pkg.name}</span>
                    <strong className="font-mono text-accent">
                      {formatRupiah(pkg.price)}
                    </strong>
                  </div>
                  {pkg.meetingPoint && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <span>Titik Kumpul:</span>
                      <span className="font-medium text-foreground">
                        {pkg.meetingPoint.name} ({pkg.meetingPoint.city})
                      </span>
                    </div>
                  )}
                  {pkg.description && (
                    <p className="text-[11px] text-muted-foreground">
                      {pkg.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3 text-xs text-muted-foreground rounded bg-muted/30 border border-border/30">
            {selectedSchedule
              ? 'Paket untuk jadwal ini sedang disiapkan.'
              : 'Pilih jadwal keberangkatan di atas untuk melihat pilihan paket.'}
          </div>
        )}
      </div>

      {/* 3. Booking CTA Action Button (Section 37) */}
      <div className="pt-2 flex flex-col gap-2">
        {ctaState === 'NO_SCHEDULE' && (
          <button
            type="button"
            disabled
            data-testid="booking-cta-button"
            className="w-full py-3 px-4 rounded bg-muted text-muted-foreground text-xs sm:text-sm font-semibold cursor-not-allowed text-center border border-border/40"
          >
            Pilih Jadwal Keberangkatan
          </button>
        )}

        {ctaState === 'NO_PACKAGE' && (
          <button
            type="button"
            disabled
            data-testid="booking-cta-button"
            className="w-full py-3 px-4 rounded bg-muted text-muted-foreground text-xs sm:text-sm font-semibold cursor-not-allowed text-center border border-border/40"
          >
            Pilih Paket Perjalanan
          </button>
        )}

        {ctaState === 'SOLD_OUT' && (
          <a
            href={buildWhatsAppUrl(
              whatsappNumber,
              `Halo Wildera, jadwal ${tripName} saat ini sold out. Apakah ada kuota tambahan atau jadwal lain?`,
            )}
            target="_blank"
            rel="noreferrer"
            data-testid="booking-cta-button"
            className="w-full py-3 px-4 rounded bg-red-700/80 text-white text-xs sm:text-sm font-semibold hover:bg-red-700 transition-colors text-center"
          >
            Jadwal Penuh — Hubungi Admin
          </a>
        )}

        {ctaState === 'READY' && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            onClick={handleBookingClick}
            data-testid="booking-cta-button"
            className="w-full py-3.5 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-all shadow hover:shadow-lg text-center flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.529 1.769.78 2.796.78h.001c3.181 0 5.767-2.586 5.767-5.766.001-3.181-2.585-5.767-5.768-5.767zm3.393 8.169c-.143.403-.833.774-1.157.824-.325.051-.749.073-2.197-.521-1.849-.759-3.033-2.645-3.125-2.768-.093-.123-.746-.993-.746-1.892 0-.899.47-1.341.637-1.523.167-.183.364-.228.486-.228.122 0 .243.001.349.006.111.005.259-.042.406.311.153.367.519 1.267.564 1.359.046.091.077.198.016.32-.061.122-.092.198-.183.305-.091.107-.193.239-.275.32-.091.091-.186.19-.08.373.106.183.47 1.229 1.346 1.758.487.294.896.386 1.026.447.13.061.206.052.283-.036.077-.089.333-.388.423-.521.09-.133.182-.111.304-.066.122.045.772.364.906.431.134.067.223.1.256.155.033.056.033.325-.11.728z" />
            </svg>
            <span>Book via WhatsApp</span>
          </a>
        )}

        <span className="text-[11px] text-muted-foreground text-center">
          Pemesanan langsung ditangani tim konsultan Wildera
        </span>
      </div>
    </div>
  );
}
