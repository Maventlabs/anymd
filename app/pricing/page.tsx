import { auth } from "@/auth";
import BrandLogo from "@/components/brand-logo";
import PageMotion from "@/components/page-motion";
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
    <PageMotion className="page-motion-root pricing-motion-root">
    <main className="pricing-page">
      <header className="pricing-header" data-gsap="reveal">
        <Link href="/" aria-label="AnyMD home"><BrandLogo className="wordmark-image" /></Link>
        <Link href="/">Back to product planning</Link>
      </header>
      <section className="pricing-hero" aria-labelledby="pricing-title" data-gsap="group">
        <span className="section-kicker">AnyMD / Pricing</span>
        <h1 id="pricing-title" data-gsap-item>Pay once for the documents you need.</h1>
        <p data-gsap-item>Choose a token package for document generation. Tokens do not expire.</p>
      </section>
      <PricingTable signedIn={Boolean(session?.user?.id)} />
    </main>
    </PageMotion>
  );
}
