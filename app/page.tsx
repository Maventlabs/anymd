/*
 * THESIS: AnyMD turns a rough thought into an agent-ready beginning; the page
 * refuses the generic AI dashboard hero.
 * OWN-WORLD: pure white and voltage blue, heavy grotesk type, hard-edged
 * browser previews, compact controls, and alternating full-width bands.
 * STORY: write the idea, see the future output, understand the clarification
 * path, then continue with confidence.
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
    "What can I do in this preview?",
    "Write an idea in any language, choose optional tech preferences, answer adaptive questions, pick a visual direction, review automatic skill recommendations, and generate structured Markdown documents with the configured AI provider. Drafts stay local until generation; authenticated jobs and token purchases are handled server-side.",
  ],
  [
    "Is this another AI app builder?",
    "No. AnyMD is being built to prepare the documents, not execute the code. You bring the resulting brief and instructions to your own coding agent, in your own environment.",
  ],
  [
    "Do I need to know my tech stack?",
    "Not at all. Every category has an Open option. You can describe the problem first and leave technology decisions open.",
  ],
  [
    "Will it work with my coding agent?",
    "The output is plain Markdown: prd.md plus AGENTS.md. Support for instruction files varies by agent. For Claude Code, you can include an optional CLAUDE.md importer containing @AGENTS.md.",
  ],
  [
    "Should I write a PRD for every change?",
    "Probably not. AnyMD is intended for new products and substantial, multi-step features. For a small fix or one extra form field, a direct prompt is usually enough.",
  ],
];

const stackRows = [
  ["Frontend", "Next.js / Vue & Nuxt / SvelteKit / Astro"],
  ["Backend", "Node.js & Express / FastAPI / Go / NestJS"],
  ["Database", "Neon / Supabase / PlanetScale / MongoDB Atlas / Postgres"],
  ["Auth", "Clerk / Auth0 / Supabase Auth / Auth.js"],
  ["Payments", "Stripe / Xendit / Paddle / LemonSqueezy"],
  ["Hosting", "Vercel / Railway / Fly.io / Your own server"],
];

export default async function Home() {
  const session = await auth();
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
             <a href="/pricing">Tokens</a>
              {session?.user ? <SignOutButton /> : <a href="/login">Log in</a>}
           </nav>
        <a className="nav-cta" href="#idea">
          Start with an idea <ArrowUpRight aria-hidden="true" />
        </a>
      </header>

      <main id="main" className="landing">
        <section className="hero band-white" aria-labelledby="hero-title">
          <div className="shell hero-shell">
            <HeroLaser />
            <div className="hero-copy">
              <div className="hero-meta" data-reveal>
                <span>AnyMD by Maventlabs</span>
                <span>Fase 1 / A thoughtful beginning</span>
              </div>
              <h1 id="hero-title">
                <SplitText text="Big idea." />
                <SplitText text="Clear beginning." delay={46} />
              </h1>
              <p data-reveal>
                Turn a rough product thought into a direction your coding agent
                can actually follow.
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
              Website previews / Placeholder collection
            </span>
            <SplitText
              tag="h2"
              text="Ideas that are ready to become interfaces."
              className="section-title"
            />
            <p data-reveal>
              These 16:9 frames will become a rotating gallery of websites made
              from AnyMD briefs. For Fase 1, they intentionally remain preview
              placeholders.
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
                  01 / The process
                </span>
                <SplitText
                  tag="h2"
                  text="From a loose thought to a shared direction."
                  className="section-title"
                />
                <p data-reveal>
                  The journey gives your agent context before it gives you code.
                </p>
              </div>
              <ol className="process-list">
                {[
                  [
                    "Tell us the idea",
                    "The problem, the people, the possibility. Write naturally and start with what you know.",
                    "Available now",
                  ],
                  [
                    "Work through the unknowns",
                    "Focused clarification defines the audience, scope, and decisions that materially change the build.",
                    "Available now",
                  ],
                  [
                    "Give your agent a better start",
                    "A product brief and working instructions, designed to travel together without a folder of duplicate documents.",
                    "Coming later",
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
                  02 / The output
                </span>
                <SplitText
                  tag="h2"
                  text="Two files. One clear working context."
                  className="section-title"
                />
              </div>
              <p data-reveal>
                A clean separation between what to build and how the coding
                agent should work.
                <span className="sample-label">
                  Illustrative excerpts, not generated output.
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
                  <span className="document-caption">Sample client portal</span>
                  <h3>The product, precisely.</h3>
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
                    Instructions that stay with the project
                  </span>
                  <h3>The working agreement.</h3>
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
                Then, a short initiation prompt brings both files to your agent.
                <span>Planned for a later phase. No extra default document.</span>
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
                03 / Clarify what matters
              </span>
              <SplitText
                tag="h2"
                text="The right question changes the brief."
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
                answers. No arbitrary completeness score. No questionnaire for
                its own sake.
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
                04 / Optional decisions
              </span>
              <SplitText
                tag="h2"
                text="Bring a stack. Or bring an open mind."
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
              Set preferences in the idea box
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
                05 / Know-how is not access
              </span>
              <SplitText
                tag="h2"
                text="Better instructions. Not more instructions."
                className="section-title"
              />
              <p data-reveal>
                A useful brief respects the environment your agent actually has.
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
                text="A little direction. A lot less generic."
                className="section-title"
              />
              <p data-reveal>
                Typography, a considered palette, and explicit boundaries give
                an agent direction without pretending AnyMD is a design tool.
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
              07 / Private by default in this preview
            </span>
            <SplitText
              tag="h2"
              text="Your next big thing. Not someone else's data."
              className="section-title"
            />
            <p data-reveal>
              Your working draft stays in React state in this browser tab until
              you submit it. Generation sends the selected brief to the
              configured server-side provider and stores the job result so the
              queue can retry, recover, and enforce quota safely.
            </p>
            <div className="privacy-flow" data-reveal>
              <span>Your idea</span>
              <span aria-hidden="true">-&gt;</span>
              <span>This tab until submit</span>
              <span aria-hidden="true">-&gt;</span>
              <span>Queued server-side</span>
            </div>
            <div className="privacy-note" data-reveal>
              <LockKeyhole aria-hidden="true" />
              <p>
                No account. No API key. No submission. Self-hosting and provider
                choice remain roadmap items.
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
                08 / Before you begin
              </span>
              <SplitText
                tag="h2"
                text="A clear start should leave fewer questions."
                className="section-title"
              />
              <div className="faq-action" data-reveal>
                <span>For the project you keep thinking about.</span>
                <h3>Start somewhere. Start with your idea.</h3>
                <a className="pill inverse" href="#idea">
                  Give it a beginning <ArrowUpRight aria-hidden="true" />
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
      </main>

      <footer className="shell footer">
        <a className="wordmark" href="#" aria-label="AnyMD home">
          <BrandLogo className="wordmark-image" />
        </a>
        <p>
          A Maventlabs project.
          <br />
          Built for thoughtful beginnings.
        </p>
        <div>
          <a href="#privacy">
            Privacy in this preview <ArrowUpRight aria-hidden="true" />
          </a>
          <a
            href="https://github.com/vetrns/skills-vault"
            target="_blank"
            rel="noreferrer"
          >
            <Github aria-hidden="true" /> Explore the skill source
          </a>
        </div>
        <span>Fase 1 / Landing foundation</span>
      </footer>
    </LandingMotion>
  );
}
