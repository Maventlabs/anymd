/*
 * THESIS: AnyMD turns a rough thought into an agent-ready beginning; the page
 * refuses the generic AI dashboard hero.
 * OWN-WORLD: pure white and voltage blue, heavy grotesk type, hard-edged
 * browser previews, compact controls, and alternating full-width bands.
 * STORY: write the idea, see the output shape, answer the key questions, then
 * continue with a brief your coding agent can use.
 * FIRST VIEWPORT: a large two-line promise sits above one compact prompt
 * composer while a restrained laser field makes the input feel active.
 * FORM: a blueprint-to-interface scroll, with opposing preview marquees as the
 * memorable handoff from raw idea to visible product.
 */
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  FileText,
  Fingerprint,
  Github,
  Layers,
  LockKeyhole,
  Plug,
  Terminal,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import SignOutButton from "@/components/sign-out-button";
import HeroLaser from "@/components/hero-laser";
import HeroTrail from "@/components/hero-trail";
import IdeaWizard from "@/components/idea-wizard";
import LandingMotion from "@/components/landing-motion";
import PricingTable from "@/components/pricing-table";
import SiteShowcase from "@/components/site-showcase";
import SplitText from "@/components/split-text";
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
    "Describe an idea in any language, answer focused questions, choose a visual direction, review skill recommendations, and generate a structured prd.md plus AGENTS.md. An optional CLAUDE.md bridge is available for Claude Code projects.",
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
    "The output is plain Markdown: prd.md plus AGENTS.md. Most coding agents can read these files. For Claude Code, you can include an optional CLAUDE.md bridge containing @AGENTS.md.",
  ],
  [
    "When should I use AnyMD?",
    "Use it for a new product or a substantial, multi-step feature. A small fix or one extra form field usually needs a direct prompt instead.",
  ],
];

const stackRows = [
  ["Frontend", "Next.js / Vue & Nuxt / SvelteKit / Astro"],
  ["Backend", "Node.js & Express / FastAPI / Go / NestJS"],
  ["Database", "Neon / Supabase / PlanetScale / MongoDB Atlas / Postgres"],
  ["Auth", "Clerk / Auth0 / Supabase Auth / Auth.js"],
  ["Payments", "Stripe / Xendit / Paddle / LemonSqueezy"],
  ["Hosting", "Netlify / Railway / Fly.io / Your own server"],
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
      "A product planning workspace that creates PRD.md and AGENTS.md files for coding agents.",
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
      <header className="nav shell">
        <a className="wordmark" href="#" aria-label="AnyMD home">
          <BrandLogo className="wordmark-image" />
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#output">The output</a>
          <a href="#principles">Our approach</a>
          <a href="#pricing">Pricing</a>
          {session?.user ? <SignOutButton /> : <a href="/login">Log in</a>}
        </nav>
        <a className="nav-cta" href="#idea">
          Start with an idea <ArrowUpRight aria-hidden="true" />
        </a>
      </header>

      <main id="main" className="landing">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <section className="hero band-white" aria-labelledby="hero-title">
          <div className="shell hero-shell">
            <HeroLaser />
            <div className="hero-copy">
              <div className="hero-meta" data-reveal>
                <span>AnyMD by Maventlabs</span>
                <span>Product planning for coding agents</span>
              </div>
              <h1 id="hero-title">
                <SplitText text="Turn product ideas" />
                <SplitText text="into build-ready briefs." delay={46} />
              </h1>
              <p data-reveal>
                Clarify the product, answer the decisions that affect scope, and
                export the project context your coding agent needs.
              </p>
            </div>
            <IdeaWizard />
          </div>
        </section>

        <section
          className="showcase band-blue"
          aria-labelledby="showcase-title"
        >
          <div className="shell showcase-heading">
            <span className="section-kicker" data-reveal>
              Illustrative product concepts
            </span>
            <SplitText
              tag="h2"
              id="showcase-title"
              text="See the product contexts your brief can describe."
              className="section-title"
            />
            <p data-reveal>
              These wireframes show example product directions. They are visual
              references for the brief, not generated websites.
            </p>
          </div>
          <SiteShowcase />
        </section>

        <section
          className="section band-white process"
          id="how-it-works"
          aria-labelledby="process-title"
        >
          <HeroTrail>
            <div className="shell process-grid">
              <div className="process-sticky">
                <span className="section-kicker" data-reveal>
                  01 / How it works
                </span>
                <SplitText
                  tag="h2"
                  id="process-title"
                  text="From product idea to working brief."
                  className="section-title"
                />
                <p data-reveal>
                  Describe the product, resolve the important unknowns, and export
                  the files your coding agent can follow.
                </p>
              </div>
              <ol className="process-list">
                {[
                  [
                    "Describe the product",
                    "The problem, the people, the possibility. Write naturally and start with what you know.",
                    "Available now",
                  ],
                  [
                    "Answer the decisions that affect scope",
                    "Focused clarification defines the audience, scope, and decisions that materially change the build.",
                    "Available now",
                  ],
                  [
                    "Export the project context",
                    "A product brief and working instructions that travel together without duplicate setup notes.",
                    "Available now",
                  ],
                ].map(([title, body, status], index) => (
                  <li key={title} data-reveal>
                    <span className="process-number">0{index + 1}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                      <span className="status-label">{status}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </HeroTrail>
        </section>

        <section
          className="section band-blue"
          id="output"
          aria-labelledby="output-title"
        >
          <div className="shell">
            <div className="output-heading">
              <div>
                <span className="section-kicker" data-reveal>
                  02 / Output files
                </span>
                <SplitText
                  tag="h2"
                  id="output-title"
                  text="Two files that keep the build aligned."
                  className="section-title"
                />
              </div>
              <p data-reveal>
                prd.md defines what to build. AGENTS.md defines how your coding
                agent should work.
                <span className="sample-label">
                  Illustrative excerpts from the output format.
                </span>
              </p>
            </div>
            <div className="document-spread">
              <article className="document" data-reveal>
                <div className="document-bar">
                  <FileText aria-hidden="true" />
                  <span>prd.md</span>
                  <span>What to build</span>
                </div>
                <div className="document-content">
                  <span className="document-caption">Example product brief</span>
                  <h3>Product scope and decisions.</h3>
                  <p>
                    One place for freelance designers and clients to keep
                    project decisions moving.
                  </p>
                  <div className="document-rule" data-motion-line />
                  <h4>Feedback & approvals</h4>
                  <p>Priority: P0 / Depends on: Project workspace</p>
                  <div className="criteria">
                    <Check aria-hidden="true" />
                    <p>
                      Accepted when each decision is attached to a milestone and
                      visible to both people.
                    </p>
                  </div>
                </div>
              </article>
              <article className="document agents-document" data-reveal>
                <div className="document-bar">
                  <Terminal aria-hidden="true" />
                  <span>AGENTS.md</span>
                  <span>How to work</span>
                </div>
                <div className="document-content">
                  <span className="document-caption">
                    Instructions that stay with the repository
                  </span>
                  <h3>Agent instructions.</h3>
                  <div className="instruction">
                    <span>Must</span>
                    <p>Check recommended skills and use them when installed and relevant.</p>
                  </div>
                  <div className="instruction">
                    <span>Must</span>
                    <p>Implement the smallest complete, verifiable phase.</p>
                  </div>
                  <div className="instruction">
                    <span>Must not</span>
                    <p>Assume MCP access or expand beyond the agreed scope.</p>
                  </div>
                </div>
              </article>
            </div>
            <div className="output-note" data-reveal>
              <ArrowDown aria-hidden="true" />
              <p>
                Then, use the included initiation prompt to bring both files into
                your coding agent.
                <span>Optional CLAUDE.md support is available for Claude Code.</span>
              </p>
            </div>
          </div>
        </section>

        <section
          className="section band-white clarification"
          aria-labelledby="clarify-title"
        >
          <div className="shell split-layout">
            <div>
              <span className="section-kicker" data-reveal>
                03 / Clarify the brief
              </span>
              <SplitText
                tag="h2"
                id="clarify-title"
                text="Answer the questions that change the build."
                className="section-title"
              />
            </div>
            <div className="clarification-copy">
              <p data-reveal>
                A booking app for a neighborhood tutor is not a booking app for
                a hospital. The details should change the plan.
              </p>
              <p data-reveal>
                Essential questions combine with follow-ups that adapt to your
                answers. Each question exists to improve the brief.
              </p>
              <div className="question-example" data-reveal>
                <span>For example</span>
                <h3>Who needs this most, and what do they do today?</h3>
                <span>A question, not an assumption.</span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="section band-blue stack-section"
          id="stack"
          aria-labelledby="stack-title"
        >
          <div className="shell">
            <div className="centered-heading">
              <span className="section-kicker" data-reveal>
                04 / Stack preferences
              </span>
              <SplitText
                tag="h2"
                id="stack-title"
                text="Set the decisions you have already made."
                className="section-title"
              />
              <p data-reveal>
                Set what is already decided. Leave the rest open. Preferences
                guide the brief; they never block the starting point.
              </p>
            </div>
            <div className="stack-ledger">
              {stackRows.map(([label, values]) => (
                <div key={label} data-reveal>
                  <span>{label}</span>
                  <p>{values}</p>
                </div>
              ))}
            </div>
            <a className="text-link centered-link" href="#idea">
              Edit stack preferences in the idea box
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </section>

        <section
          className="section band-white"
          id="principles"
          aria-labelledby="skills-title"
        >
          <div className="shell split-layout">
            <div>
              <span className="section-kicker" data-reveal>
                05 / Skills and tools
              </span>
              <SplitText
                tag="h2"
                id="skills-title"
                text="Give your agent relevant guidance, not invented access."
                className="section-title"
              />
              <p data-reveal>
                AnyMD separates local task guidance from access to external tools.
              </p>
            </div>
            <div className="capability-compare">
              <article data-reveal>
                <Layers aria-hidden="true" />
                <span>Skills</span>
                <h3>The know-how.</h3>
                <p>
                  Local instructions for how to approach a task. Check locally;
                  use conditionally.
                </p>
              </article>
              <span className="not-equal" aria-label="is not the same as">
                !=
              </span>
              <article data-reveal>
                <Plug aria-hidden="true" />
                <span>MCP</span>
                <h3>The connection.</h3>
                <p>
                  Access to external tools and services. Verify availability and
                  permissions first.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section
          className="section band-blue visual"
          aria-labelledby="visual-title"
        >
          <div className="shell split-layout visual-layout">
            <div className="type-specimen" data-reveal aria-hidden="true">
              <span className="specimen-display">Aa</span>
              <span className="specimen-ui">Aa</span>
              <div className="swatches">
                <span />
                <span />
                <span />
                <span />
              </div>
              <p>One blue. One white. Clear roles.</p>
            </div>
            <div>
              <span className="section-kicker" data-reveal>
                06 / Visual direction
              </span>
              <SplitText
                tag="h2"
                id="visual-title"
                text="Give your agent a visual brief it can implement."
                className="section-title"
              />
              <p data-reveal>
                Typography, palette, and explicit boundaries give an agent a
                usable visual direction without pretending AnyMD is a design tool.
              </p>
              <ul className="plain-list" data-reveal>
                <li>
                  <Check aria-hidden="true" /> A deliberate type hierarchy
                </li>
                <li>
                  <Check aria-hidden="true" /> A limited, purposeful palette
                </li>
                <li>
                  <Check aria-hidden="true" /> Rules against visual noise
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section
          className="section band-white privacy"
          id="privacy"
          aria-labelledby="privacy-title"
        >
          <div className="shell privacy-content">
            <Fingerprint aria-hidden="true" className="privacy-icon" />
            <span className="section-kicker" data-reveal>
              07 / Draft handling
            </span>
            <SplitText
              tag="h2"
              id="privacy-title"
               text="Your draft stays in this browser until you submit it."
              className="section-title"
            />
            <p data-reveal>
               Your working draft stays in local browser storage until you submit
               it. Generation sends the selected brief to the server-side provider
               and stores the job result so the queue can recover safely.
            </p>
            <div className="privacy-flow" data-reveal>
              <span>Your idea</span>
              <span aria-hidden="true">-&gt;</span>
               <span>Local browser until submit</span>
              <span aria-hidden="true">-&gt;</span>
              <span>Queued server-side</span>
            </div>
            <div className="privacy-note" data-reveal>
              <LockKeyhole aria-hidden="true" />
              <p>
                The draft is not submitted until you continue to generation. AnyMD
                does not expose provider credentials in the browser.
              </p>
            </div>
          </div>
        </section>

        <section
          className="section band-blue faq"
          id="faq"
          aria-labelledby="faq-title"
        >
          <div className="shell faq-grid">
            <div className="faq-heading">
              <span className="section-kicker" data-reveal>
                08 / Questions before you start
              </span>
              <SplitText
                tag="h2"
                id="faq-title"
                text="Know what happens before you write."
                className="section-title"
              />
              <div className="faq-action" data-reveal>
                <span>For a new product or a substantial feature.</span>
                <h3>Describe the product you want to build.</h3>
                <a className="pill inverse" href="#idea">
                  Describe your idea <ArrowUpRight aria-hidden="true" />
                </a>
              </div>
            </div>
            <Accordion type="single" collapsible className="faq-accordion">
              {faqs.map(([question, answer], index) => (
                <AccordionItem
                  key={question}
                  value={`item-${index}`}
                  className="faq-item"
                  data-reveal
                >
                  <AccordionTrigger className="faq-trigger">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="faq-content">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section
          className="section band-white pricing-landing"
          id="pricing"
          aria-labelledby="landing-pricing-title"
        >
          <div className="shell">
            <div className="centered-heading">
              <span className="section-kicker" data-reveal>
                09 / Pricing
              </span>
              <SplitText
                tag="h2"
                id="landing-pricing-title"
                text="Generate when your brief is ready."
                className="section-title"
              />
              <p data-reveal>
                Start with the included quota. Buy tokens only when you need
                additional document generations.
              </p>
            </div>
            <PricingTable
              signedIn={Boolean(session?.user?.id)}
              returnTo="/"
            />
          </div>
        </section>
      </main>

      <footer className="shell footer">
        <a className="wordmark" href="#" aria-label="AnyMD home">
          <BrandLogo className="wordmark-image" />
        </a>
        <p>
          A Maventlabs project.
          <br />
          Product planning for coding agents.
        </p>
        <div>
          <a href="#privacy">
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
        <span>AnyMD by Maventlabs</span>
      </footer>
    </LandingMotion>
  );
}
