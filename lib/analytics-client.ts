import type { AnalyticsEventName } from "@/lib/privacy-events";

const consentStorageKey = "anymd:analytics-consent";
let memoryConsent: AnalyticsConsent | null = null;

export type AnalyticsConsent = "granted" | "declined";

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(consentStorageKey);
    if (value === "granted" || value === "declined") {
      memoryConsent = value;
      return value;
    }
  } catch {
    return memoryConsent;
  }
  return memoryConsent;
}

export function setAnalyticsConsent(value: AnalyticsConsent) {
  memoryConsent = value;
  try {
    window.localStorage.setItem(consentStorageKey, value);
  } catch {
    // Keep the current choice in memory when browser storage is unavailable.
  }
  window.dispatchEvent(new Event("anymd-analytics-consent"));
}

export function trackAnalytics(
  event: AnalyticsEventName,
  properties?: Record<string, string | number | boolean>,
) {
  if (getAnalyticsConsent() !== "granted") return;
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ consent: true, event, properties }),
    keepalive: true,
  }).catch(() => undefined);
}
