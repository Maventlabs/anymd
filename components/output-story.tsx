"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, FileText } from "lucide-react";
import { SiClaude, SiDeepseek, SiGooglegemini, SiKimi, SiMeta } from "@icons-pack/react-simple-icons";
import { Reveal1 } from "@/components/ui/reveal1";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import { AnimatedList } from "@/components/ui/animated-list";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const AgentGlobe = dynamic(
  () => import("@/components/ui/globe").then((module) => module.AgentGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="story-globe-fallback" aria-hidden="true">
        <span />
      </div>
    ),
  }
);

type Agent = {
  name: string;
  short: string;
  Icon?: typeof SiClaude;
  logo?: string;
};

const agents: Agent[] = [
  { name: "Claude", short: "Cl", Icon: SiClaude },
  { name: "GPT", short: "GPT", logo: "/agents/openai.svg" },
  { name: "Gemini", short: "Ge", Icon: SiGooglegemini },
  { name: "DeepSeek", short: "Ds", Icon: SiDeepseek },
  { name: "Kimi", short: "Ki", Icon: SiKimi },
  { name: "Muse", short: "Mu", Icon: SiMeta },
  { name: "GLM", short: "GLM", logo: "/agents/glm.svg" },
  { name: "Codex", short: "Cx", logo: "/agents/openai.svg" },
];

const files = [
  { name: "prd.md", job: "What to build" },
  { name: "AGENTS.md", job: "How to work" },
  { name: "SESSION.md", job: "What changed" },
  { name: "CLAUDE.md", job: "Optional bridge" },
];

function AgentBadge({ agent }: { agent: Agent }) {
  return (
    <span className="story-agent-badge" title={agent.name}>
      {agent.logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- fixed local brand SVG
        <img src={agent.logo} alt="" width={20} height={20} aria-hidden="true" />
      ) : agent.Icon ? (
        <agent.Icon size={20} aria-hidden="true" />
      ) : (
        <span aria-hidden="true">{agent.short}</span>
      )}
      <span className="sr-only">{agent.name}</span>
    </span>
  );
}

function AgentOrbit() {
  const outer = agents.slice(0, 5);
  const inner = agents.slice(5);
  return (
    <div className="story-orbit" aria-hidden="true">
      <svg className="story-orbit-paths" viewBox="0 0 400 400" focusable="false">
        <circle cx={200} cy={200} r={150} />
        <circle cx={200} cy={200} r={92} className="is-dashed" />
      </svg>
      <span className="story-orbit-core">
        <Image
          src="/brand/anymd-mark.png"
          alt=""
          width={44}
          height={44}
          unoptimized
        />
      </span>
      <OrbitingCircles radius={150} duration={26} iconSize={52} path={false}>
        {outer.map((agent) => (
          <AgentBadge key={agent.name} agent={agent} />
        ))}
      </OrbitingCircles>
      <OrbitingCircles radius={92} duration={18} reverse iconSize={48} path={false}>
        {inner.map((agent) => (
          <AgentBadge key={agent.name} agent={agent} />
        ))}
      </OrbitingCircles>
    </div>
  );
}

function FileLedger({ staticList }: { staticList: boolean }) {
  if (staticList) {
    return (
      <ul className="story-files">
        {files.map((file) => (
          <li key={file.name} className="story-file-row">
            <FileText aria-hidden="true" />
            <span>
              <strong>{file.name}</strong>
              <small>{file.job}</small>
            </span>
            <Check aria-hidden="true" />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <AnimatedList delay={900} className="story-files">
      {files.map((file) => (
        <div key={file.name} className="story-file-row">
          <FileText aria-hidden="true" />
          <span>
            <strong>{file.name}</strong>
            <small>{file.job}</small>
          </span>
          <Check aria-hidden="true" />
        </div>
      ))}
    </AnimatedList>
  );
}

const steps = [
  {
    kicker: "01 — From rough to reviewable",
    title: "Rough in, reviewable out.",
    body: "Ideas arrive as fragments. AnyMD structures them into sections you can compare, question, and approve before a single line of code exists. Drag the divider to compare a wireframe sketch with the finished page.",
  },
  {
    kicker: "02 — Plain Markdown",
    title: "One brief, every agent you already use.",
    body: "prd.md, AGENTS.md, and SESSION.md are plain text files. They open directly in the coding tools on your machine, with nothing to install and no new format to learn.",
  },
  {
    kicker: "03 — Travels with you",
    title: "Files that work anywhere you build.",
    body: "Self-hosted or cloud, solo or team: the brief, the skill guidance, and the MCP boundaries travel as files. The ledger below assembles exactly what leaves AnyMD with you.",
  },
];

export default function OutputStory() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [staticMode, setStaticMode] = useState(false);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const narrow = window.matchMedia("(max-width: 899px)").matches;
      const scope = root.current;
      if (reduce || narrow || !scope) {
        setStaticMode(true);
        return;
      }

      /* Both columns pin together; a scrubbed timeline crossfades copy and
         visuals in lockstep, so nothing ever jumps on scroll. */
      const steps = gsap.utils.toArray<HTMLElement>(".story-step", scope);
      const panes = gsap.utils.toArray<HTMLElement>(".story-scroll-pane", scope);
      const stage = scope.querySelector<HTMLElement>(".story-stage");
      const trackElement = scope.querySelector<HTMLElement>(".story-track");
      if (!stage || !trackElement || steps.length !== 3 || panes.length !== 3) {
        setStaticMode(true);
        return;
      }

      gsap.set(steps, { autoAlpha: 0, y: 44 });
      gsap.set(steps[0], { autoAlpha: 1, y: 0 });
      gsap.set(panes, { autoAlpha: 0, scale: 0.965 });
      gsap.set(panes[0], { autoAlpha: 1, scale: 1 });

      const timeline = gsap.timeline({
        defaults: { ease: "power1.inOut" },
        scrollTrigger: {
          trigger: trackElement,
          start: "top top",
          end: "+=220%",
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
          onUpdate: (self) => {
            const index = Math.min(2, Math.floor(self.progress * 3));
            setActive((current) => (current === index ? current : index));
          },
        },
      });

      let position = 0;
      for (let index = 0; index < 2; index += 1) {
        timeline.to(steps[index], { autoAlpha: 0, y: -44, duration: 0.5 }, position);
        timeline.to(panes[index], { autoAlpha: 0, scale: 0.965, duration: 0.5 }, position);
        timeline.to(steps[index + 1], { autoAlpha: 1, y: 0, duration: 0.5 }, position + 0.5);
        timeline.to(panes[index + 1], { autoAlpha: 1, scale: 1, duration: 0.5 }, position + 0.5);
        position += 1;
      }

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    },
    { scope: root }
  );

  const visuals = [
    <Reveal1
      key="reveal"
      className="output-reveal"
      beforeImage={{
        src: "/marquee/Capture-5-wireframe.svg",
        alt: "Wireframe sketch of a landing page",
      }}
      afterImage={{
        src: "/marquee/Capture-5.png",
        alt: "Finished landing page built from the wireframe",
      }}
      beforeLabel="Wireframe"
      afterLabel="Built"
    />,
    <div key="orbit">
      <AgentOrbit />
      <p className="story-visual-caption">Eight tools that read the same three files.</p>
    </div>,
    <div key="globe">
      <div className="story-globe">
        <AgentGlobe />
      </div>
      <p className="story-visual-caption">Generated once, readable everywhere you work.</p>
    </div>,
  ];

  return (
    <section
      ref={root}
      className="section output-story band-white"
      id="output"
      aria-labelledby="output-story-title"
    >
      <div className="shell">
        <div className="story-heading" data-gsap="group">
          <h2 className="story-title" id="output-story-title" data-gsap-item>
            See what the brief becomes.
          </h2>
          <p className="story-lede" data-gsap-item>
            Each part of the AnyMD flow ends in something you can see, check,
            and carry into your coding agent. Scroll through the three.
          </p>
        </div>

        <div className="story-track">
          {staticMode ? (
            <div className="story-static">
              {steps.map((step, index) => (
                <article key={step.kicker} className="story-static-card">
                  <p className="story-kicker">{step.kicker}</p>
                  <h3 className="story-step-title">{step.title}</h3>
                  <p>{step.body}</p>
                  {index === 2 ? <FileLedger staticList /> : null}
                  <div className="story-static-visual">{visuals[index]}</div>
                </article>
              ))}
            </div>
          ) : (
            <div className="story-stage">
              <div className="story-copy" aria-live="polite">
                {steps.map((step, index) => (
                  <article
                    key={step.kicker}
                    className={`story-step${index === active ? " is-active" : ""}`}
                    aria-hidden={index !== active}
                  >
                    <p className="story-kicker">{step.kicker}</p>
                    <div className="story-step-body">
                      <h3 className="story-step-title">{step.title}</h3>
                      <p>{step.body}</p>
                      {index === 2 ? <FileLedger staticList={false} /> : null}
                    </div>
                  </article>
                ))}
              </div>

              <div className="story-visual">
                {visuals.map((visual, index) => (
                  <div
                    key={index}
                    className="story-scroll-pane"
                    aria-hidden={index !== active}
                  >
                    {visual}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
