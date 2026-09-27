"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  trackAnalytics,
} from "@/lib/analytics-client";

export default function AnalyticsConsent() {
  const consent = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("anymd-analytics-consent", onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener("anymd-analytics-consent", onStoreChange);
      };
    },
    getAnalyticsConsent,
    () => null,
  );

  useEffect(() => {
    if (consent === "granted") trackAnalytics("page_view");
  }, [consent]);

  if (consent !== null) return null;

  function choose(value: "granted" | "declined") {
    setAnalyticsConsent(value);
  }

  return (
    <aside className="analytics-consent" aria-label="Analytics consent">
      <p>
        Help us understand how AnyMD is used with anonymous analytics that only
        activate after you agree.
      </p>
      <div className="analytics-consent-actions">
        <button type="button" onClick={() => choose("declined")}>
          Not now
        </button>
        <button type="button" onClick={() => choose("granted")}>
          Allow analytics
        </button>
      </div>
    </aside>
  );
}
