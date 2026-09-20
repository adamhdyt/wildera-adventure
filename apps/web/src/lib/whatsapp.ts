/**
 * Centralized WhatsApp Conversion Utilities (STEP 22)
 *
 * Per Prompt Master STEP 22 & UX Specification §38, §39, §43, §59:
 * - Centralized message builders for consistent communication tone.
 * - Contextual trip information (Trip, Schedule, Package, Price).
 * - Sanitized phone numbers (E.164 formatted without non-digits).
 * - Zero sensitive data leaks (no tokens, passwords, payment info).
 * - Unified tracking helper for analytics events (click_book_whatsapp, click_health_whatsapp).
 */

export {
  type BookingWhatsAppParams,
  buildBookingWhatsAppMessage,
  buildHealthRequirementWhatsAppMessage,
  buildGlobalWhatsAppMessage,
  buildPrivateTripWhatsAppMessage,
  buildWhatsAppUrl,
  normalizePhoneNumber,
} from '@wildera/validation';

export interface WhatsAppEventProps {
  trip_id?: string;
  trip_name?: string;
  schedule_id?: string;
  schedule_date?: string;
  package_id?: string;
  package_name?: string;
  source?: string;
}

/**
 * Dispatches analytics event safely without breaking SSR or throwing on missing dataLayer.
 * Per UX §39: Do not include sensitive customer data in analytics events.
 */
export function trackWhatsAppClick(
  eventName:
    'click_book_whatsapp' | 'click_health_whatsapp' | 'click_global_whatsapp',
  properties?: WhatsAppEventProps,
): void {
  if (typeof window === 'undefined') return;

  const eventData = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...properties,
  };

  // Push to GTM / dataLayer if present
  try {
    const w = window as unknown as {
      dataLayer?: Array<Record<string, unknown>>;
    };
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push(eventData);
    }
  } catch {
    // Ignore dataLayer errors
  }

  // Dispatch standard custom event for client-side listeners
  try {
    window.dispatchEvent(
      new CustomEvent('wildera:analytics', { detail: eventData }),
    );
  } catch {
    // Ignore CustomEvent errors
  }
}
