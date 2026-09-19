import { auth } from "@/auth";
import BrandLogo from "@/components/brand-logo";
import PricingTable from "@/components/pricing-table";
import Link from "next/link";

export default async function PricingPage() {
  const session = await auth();
  return (
    <main className="pricing-page">
      <header className="pricing-header">
        <Link href="/" aria-label="AnyMD home"><BrandLogo className="wordmark-image" /></Link>
        <Link href="/">Back to AnyMD</Link>
      </header>
      <section className="pricing-hero" aria-labelledby="pricing-title">
        <span className="section-kicker">AnyMD / Tokens</span>
        <h1 id="pricing-title">Keep the thinking moving.</h1>
        <p>Buy tokens once, use them for generated documents, and keep your project context in one place.</p>
      </section>
      <PricingTable signedIn={Boolean(session?.user?.id)} />
    </main>
  );
}
