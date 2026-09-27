/*
 * THESIS: AnyMD turns a rough thought into an agent-ready beginning; the page
 * refuses the generic AI dashboard hero.
 * OWN-WORLD: AnyMD's cool blue/white system with a full-bleed landscape film,
 * centered editorial type, and a compact idea composer.
 * STORY: write the idea, answer focused questions, then carry a clear brief
 * and working context into a coding agent.
 * FIRST VIEWPORT: the real product entry form sits in a centered stack over
 * the supplied landscape video, with the glass navbar floating above it.
 * FORM: a soft cloud transition carries the film into a clean white section.
 */
import {
  ArrowUpRight,
  Check,
  FileText,
  Github,
  Layers,
  LockKeyhole,
} from "lucide-react";
import HeroBackground from "@/components/hero-background";
import HeroLogoMarquee from "@/components/hero-logo-marquee";
import SiteHeader from "@/components/site-header";
import IdeaWizard from "@/components/idea-wizard";
import FooterUpdates from "@/components/footer-updates";
import FooterGiant from "@/components/footer-giant";
import LandingMotion from "@/components/landing-motion";
import OutputStory from "@/components/output-story";
import PricingTable from "@/components/pricing-table";
import ScopeQuote from "@/components/scope-quote";
import SiteShowcase from "@/components/site-showcase";
import SplitText from "@/components/split-text";
import WorkflowStory from "@/components/workflow-story";
import { auth } from "@/auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  [
    "What does AnyMD create?",
    "Describe an idea in any language, answer focused questions, choose a visual direction, review skill recommendations, and generate structured prd.md, AGENTS.md, and SESSION.md files. An optional CLAUDE.md bridge is available for Claude Code projects.",
  ],
  [
    "Is this another AI app builder?",
    "No. AnyMD prepares the documents; it does not execute your code. Bring the brief and instructions to the coding agent and environment you already use.",
  ],
  [
    "Do I need to know my tech stack?",
    "No. Every category includes an Open option. Describe the problem first and leave technology decisions open.",
  ],
  [
    "Will it work with my coding agent?",
    "The output is plain Markdown: prd.md, AGENTS.md, and SESSION.md. Most coding agents can read these files. For Claude Code, you can include an optional CLAUDE.md bridge containing @AGENTS.md.",
  ],
  [
    "When should I use AnyMD?",
    "Use it for a new product or a substantial, multi-step feature. A small fix or one extra form field usually needs a direct prompt instead.",
  ],
];

export default async function Home() {
  const session = await auth();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AnyMD",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description:
      "A product planning workspace that turns an idea into a clarified brief and agent-ready Markdown files.",
    url: process.env.ANYMD_APP_URL?.trim() || "http://localhost:3000",
    creator: {
      "@type": "Organization",
      name: "Maventlabs",
    },
  };
  return (
    <LandingMotion>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader
        signedIn={Boolean(session?.user?.id)}
        userImage={session?.user?.image}
      />

      <main id="main" className="landing">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <section className="hero hero-video-surface" aria-labelledby="hero-title">
          <HeroBackground />
          <div className="hero-video-scrim" aria-hidden="true" />
          <div className="shell hero-shell">
            <div className="hero-stack">
              <div className="hero-attribution" data-gsap-hero="attribution">
                <span>
                  A product by <strong>Mavent</strong>
                </span>
              </div>
              <h1 className="hero-title" id="hero-title" data-gsap-hero="copy">
                <SplitText text="Turn ideas into" />
                <SplitText text="build-ready briefs." delay={50} />
              </h1>
              <h2 className="hero-tagline" data-gsap-hero="copy">
                Clarity before code.
              </h2>
              <p className="hero-description" data-gsap-hero="copy">
                Answer focused questions and prepare the project context your
                coding agent needs.
              </p>
              <IdeaWizard />
              <ul className="hero-benefits" aria-label="What AnyMD helps you do" data-gsap-hero="proof">
                <li><LockKeyhole aria-hidden="true" /> Draft stays local</li>
                <li><Check aria-hidden="true" /> Focused questions</li>
                <li><Layers aria-hidden="true" /> Curated skill suggestions</li>
                <li><FileText aria-hidden="true" /> Three Markdown files</li>
              </ul>
            </div>
          </div>
          <div className="hero-ecosystem-footer">
            <HeroLogoMarquee />
          </div>
          <div
            className="hero-cloud-transition"
            aria-hidden="true"
          />
        </section>

        <section
          className="showcase band-white"
          aria-labelledby="showcase-title"
        >
          <div className="shell showcase-heading">
            <SplitText
              tag="h2"
              id="showcase-title"
              text="A brief that guides the build."
              className="section-title"
            />
            <p>
              AnyMD captures scope, users, constraints, and open decisions before
              your coding agent begins.
            </p>
          </div>
          <SiteShowcase />
        </section>

        <WorkflowStory />

        <OutputStory />

        <section
          className="section band-white scope"
          id="principles"
          aria-label="Product scope"
        >
          <div className="shell">
            <div className="scope-ledger">
              <ScopeQuote />
            </div>
          </div>
        </section>

        <section
          className="section band-white pricing-landing"
          id="pricing"
          aria-labelledby="landing-pricing-title"
        >
          <div className="shell">
            <div className="centered-heading" data-gsap="group">
              <SplitText
                tag="h2"
                id="landing-pricing-title"
                text="Generate when your brief is ready."
                className="section-title"
              />
              <p data-gsap-item>
                Start with the included quota. Buy one-time token packages only
                when you need more generations.
              </p>
            </div>
            <PricingTable
              signedIn={Boolean(session?.user?.id)}
              returnTo="/"
            />
          </div>
        </section>

        <section
          className="section band-white faq faq-light"
          id="faq"
          aria-labelledby="faq-title"
        >
          <div className="shell faq-dark-layout">
            <div className="faq-dark-head" data-gsap="group">
              <SplitText
                tag="h2"
                id="faq-title"
                text="Know what happens before you start."
                className="section-title"
              />
              <p data-gsap-item>
                Anything missing, bring it into the brief. The clarification
                adapts to your answers.
              </p>
            </div>
            <Accordion type="single" collapsible className="faq-accordion">
              {faqs.map(([question, answer], index) => (
                <AccordionItem
                  key={question}
                  id={`faq-${index + 1}`}
                  value={`item-${index}`}
                  className="faq-item"
                  data-gsap="reveal"
                >
                  <AccordionTrigger className="faq-trigger">
                    <span>{question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="faq-content">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell">
          <FooterGiant />
          <div className="footer-banner" data-gsap="reveal">
            <nav className="footer-grid" aria-label="Footer">
              <div className="footer-brand-col">
                <h3>A Maventlabs project.</h3>
                <p>
                  Product planning for coding agents. Leave your email to hear
                  about new Mavent products.
                </p>
                <FooterUpdates />
              </div>
              <div>
                <h3>Product</h3>
                <ul>
                  <li><a href="#how-it-works">Features</a></li>
                  <li><a href="#faq">FAQ</a></li>
                  <li><a href="#output">Output</a></li>
                  <li><a href="#principles">Approach</a></li>
                  <li><a href="#visual-direction">Visual</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h3>Company</h3>
                <ul>
                  <li><a href="#">About</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3>More Products</h3>
                <ul>
                  <li>
                    <a
                      href="https://vulpixlabs.vercel.app/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Vulpix <ArrowUpRight aria-hidden="true" />
                    </a>
                  </li>
                  <li><a href="#">Forme</a></li>
                  <li><a href="#">Moxaai</a></li>
                  <li><a href="#">Ignix</a></li>
                  <li><a href="#">Zecroix</a></li>
                </ul>
              </div>
            </nav>

            <div className="footer-bottom">
              <span>AnyMD by Maventlabs</span>
              <div>
                <a href="#how-it-works">
                  How AnyMD handles drafts <ArrowUpRight aria-hidden="true" />
                </a>
                <a
                  href="https://github.com/vetrns/skills-vault"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github aria-hidden="true" /> Explore the skill source
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </LandingMotion>
  );
}
