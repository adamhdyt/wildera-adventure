'use client';

import type { AnalyticsEvent, AnalyticsEventName } from '@wildera/types';
import {
  sanitizeAnalyticsProperties,
  validateAnalyticsEvent,
} from '@wildera/validation';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    __WILDERA_ANALYTICS_EVENTS__?: AnalyticsEvent[];
  }
}

/**
 * Dispatches an analytics event cleanly and safely.
 * Strips any PII (phone, email, name, identity, medical data) strictly.
 */
export function trackEvent(
  eventName: AnalyticsEventName,
  properties?: Record<string, unknown>,
): AnalyticsEvent | null {
  if (typeof window === 'undefined') return null;

  const rawPayload = {
    event: eventName,
    timestamp: new Date().toISOString(),
    properties: sanitizeAnalyticsProperties(properties),
  };

  const validation = validateAnalyticsEvent(rawPayload);
  if (!validation.valid || !validation.data) {
    return null;
  }

  const cleanEvent: AnalyticsEvent = {
    event: validation.data.event,
    timestamp: validation.data.timestamp,
    properties: validation.data.properties,
  };

  // 1. In-memory event stream for testing, verification & debugging
  if (!window.__WILDERA_ANALYTICS_EVENTS__) {
    window.__WILDERA_ANALYTICS_EVENTS__ = [];
  }
  window.__WILDERA_ANALYTICS_EVENTS__.push(cleanEvent);

  // 2. Google Tag Manager / dataLayer standard
  try {
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: cleanEvent.event,
        timestamp: cleanEvent.timestamp,
        ...cleanEvent.properties,
      });
    }
  } catch {
    // Ignore dataLayer errors
  }

  // 3. Custom DOM Event
  try {
    window.dispatchEvent(
      new CustomEvent('wildera:analytics', { detail: cleanEvent }),
    );
  } catch {
    // Ignore CustomEvent errors
  }

  return cleanEvent;
}

export function trackViewHome(): void {
  trackEvent('view_home', { page: 'home' });
}

export function trackViewTripList(params?: {
  difficulty?: string;
  search?: string;
  sortBy?: string;
}): void {
  trackEvent('view_trip_list', {
    page: 'trip_catalog',
    ...params,
  });
}

export function trackViewTrip(trip: {
  id?: string;
  slug: string;
  name: string;
  tripType?: string;
  mountain?: { name: string };
}): void {
  trackEvent('view_trip', {
    tripId: trip.id,
    tripSlug: trip.slug,
    tripName: trip.name,
    tripType: trip.tripType,
    mountainName: trip.mountain?.name,
  });
}

export function trackSelectSchedule(
  schedule: { id: string; startDate: string; endDate: string },
  tripSlug: string,
): void {
  trackEvent('select_schedule', {
    scheduleId: schedule.id,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    tripSlug,
  });
}

export function trackSelectPackage(
  pkg: { id: string; name: string; price: number },
  tripSlug: string,
): void {
  trackEvent('select_package', {
    packageId: pkg.id,
    packageName: pkg.name,
    price: pkg.price,
    tripSlug,
  });
}

export function trackClickBookWhatsApp(data: {
  tripSlug: string;
  scheduleId?: string | null;
  packageId?: string | null;
  price?: number | null;
}): void {
  trackEvent('click_book_whatsapp', {
    tripSlug: data.tripSlug,
    scheduleId: data.scheduleId,
    packageId: data.packageId,
    price: data.price,
  });
}

export function trackClickHealthWhatsApp(data: {
  tripSlug: string;
  mountainName?: string;
}): void {
  trackEvent('click_health_whatsapp', {
    tripSlug: data.tripSlug,
    mountainName: data.mountainName,
  });
}

export function trackPrivateTripInquiry(data: {
  destination?: string | null;
  mountainId?: string | null;
  participantCount?: number;
  preferredDate?: string;
}): void {
  trackEvent('private_trip_inquiry', {
    destination: data.destination,
    mountainId: data.mountainId,
    participantCount: data.participantCount,
    preferredDate: data.preferredDate,
  });
}
