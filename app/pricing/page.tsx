import { auth } from "@/auth";
import BrandLogo from "@/components/brand-logo";
import PricingTable from "@/components/pricing-table";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing and tokens",
  description:
    "Choose a one-time token package for generating AnyMD project documents.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const session = await auth();
  return (
    <main className="pricing-page">
      <header className="pricing-header">
        <Link href="/" aria-label="AnyMD home"><BrandLogo className="wordmark-image" /></Link>
        <Link href="/">Back to product planning</Link>
      </header>
      <section className="pricing-hero" aria-labelledby="pricing-title">
        <span className="section-kicker">AnyMD / Pricing</span>
        <h1 id="pricing-title">Pay once for the documents you need.</h1>
        <p>Choose a token package for document generation. Tokens do not expire.</p>
      </section>
      <PricingTable signedIn={Boolean(session?.user?.id)} />
    </main>
  );
}
