"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { tokenPackages, type TokenPackageId } from "@/lib/token-packages";

type PricingTableProps = { signedIn: boolean; returnTo?: string };

export default function PricingTable({
  signedIn,
  returnTo = "/pricing",
}: PricingTableProps) {
  const router = useRouter();
  const [pending, setPending] = useState<TokenPackageId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(packageId: TokenPackageId) {
    if (!signedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
      return;
    }
    setPending(packageId);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ packageId }),
      });
      const body = (await response.json()) as { url?: string; error?: { message?: string } };
      if (!response.ok || !body.url) throw new Error(body.error?.message ?? "Checkout is unavailable.");
      window.open(body.url, "_self");
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is unavailable.");
      setPending(null);
    }
  }

  return (
    <div className="pricing-wrap">
      <div className="pricing-grid">
        {(Object.entries(tokenPackages) as [TokenPackageId, (typeof tokenPackages)[TokenPackageId]][]).map(
          ([id, tokenPackage]) => (
            <article className={`pricing-card ${id === "builder" ? "pricing-card-featured" : ""}`} key={id}>
              {id === "builder" && (
                <span className="pricing-badge">
                  Recommended for a first full brief
                </span>
              )}
              <span className="pricing-kicker">{tokenPackage.tokens} tokens</span>
              <h2>{tokenPackage.name}</h2>
              <p className="pricing-price">${(tokenPackage.unitAmount / 100).toFixed(2)}</p>
              <p className="pricing-detail">
                One-time purchase. Tokens are added after payment is confirmed.
              </p>
              <ul>
                <li><Check aria-hidden="true" /> No subscription</li>
                <li><Check aria-hidden="true" /> Use when you need them</li>
              </ul>
              <button type="button" onClick={() => void checkout(id)} disabled={pending !== null}>
                {pending === id
                  ? "Opening checkout…"
                  : signedIn
                    ? "Buy tokens"
                    : "Sign in to buy"}
                <ArrowUpRight aria-hidden="true" />
              </button>
            </article>
          ),
        )}
      </div>
      {error && <p className="pricing-error" role="alert">{error}</p>}
    </div>
  );
}
