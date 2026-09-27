"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { themePresets } from "@/lib/themes";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/*
 * One bento section for the whole How-it-works story: three step cards with
 * self-drawing ink diagrams, a wide Skills-vs-MCP card, and a visual
 * direction card with the real theme presets. Warm paper on flat deep blue.
 */

const cards = [
  {
    step: "Step 01",
    title: "Describe the idea",
    body: "Write the problem, the people it serves, and what you already know. Anything unfinished can stay open.",
    visual: "draft" as const,
  },
  {
    step: "Step 02",
    title: "Answer focused questions",
    body: "Resolve scope, users, and stack choices one question at a time. Every category keeps an Open option.",
    visual: "questions" as const,
  },
  {
    step: "Step 03",
    title: "Carry the brief forward",
    body: "Review skill recommendations, then generate prd.md, AGENTS.md, and SESSION.md for your coding agent.",
    visual: "handoff" as const,
  },
];

function DraftVisual() {
  return (
    <svg viewBox="0 0 240 150" className="bento-diagram" focusable="false" aria-hidden="true">
      <rect className="ink-frame bento-draw" x={72} y={10} width={96} height={130} rx={4} />
      <line className="ink-line bento-draw" x1={86} y1={30} x2={154} y2={30} />
      <line className="ink-line bento-draw" x1={86} y1={44} x2={154} y2={44} />
      <line className="ink-line bento-draw" x1={86} y1={58} x2={132} y2={58} />
      <line className="ink-line bento-draw" x1={86} y1={78} x2={154} y2={78} />
      <line className="ink-line bento-draw" x1={86} y1={92} x2={142} y2={92} />
      <line className="ink-line bento-draw" x1={86} y1={112} x2={120} y2={112} />
      <ellipse className="ink-mark bento-draw" cx={120} cy={85} rx={42} ry={24} />
      <path className="ink-mark bento-draw" d="M 176 118 l 10 10 l 18 -20" />
    </svg>
  );
}

function QuestionsVisual() {
  const rows = [
    { y: 32, textWidth: 118 },
    { y: 71, textWidth: 96 },
    { y: 110, textWidth: 128 },
  ];
  return (
    <svg viewBox="0 0 240 150" className="bento-diagram" focusable="false" aria-hidden="true">
      <line className="ink-faint bento-draw" x1={40} y1={12} x2={40} y2={138} />
      {rows.map((row) => (
        <g key={row.y}>
          <rect className="ink-frame bento-draw" x={30} y={row.y - 10} width={20} height={20} rx={5} />
          <path className="ink-mark bento-draw" d={`M 34 ${row.y} l 5 5 l 9 -11`} />
          <line
            className="ink-line bento-draw"
            x1={60}
            y1={row.y}
            x2={60 + row.textWidth}
            y2={row.y}
          />
        </g>
      ))}
    </svg>
  );
}

function HandoffVisual() {
  const files = [
    { y: 26, label: "prd.md" },
    { y: 62, label: "AGENTS.md" },
    { y: 98, label: "SESSION.md" },
  ];
  return (
    <svg viewBox="0 0 240 150" className="bento-diagram" focusable="false" aria-hidden="true">
      {files.map((file) => (
        <g key={file.label} className="bento-file">
          <rect className="ink-frame" x={24} y={file.y} width={118} height={28} rx={7} />
          <text className="ink-mono" x={36} y={file.y + 18}>
            {file.label}
          </text>
        </g>
      ))}
      <line className="ink-mark bento-draw" x1={154} y1={69} x2={200} y2={69} />
      <path className="ink-mark bento-draw" d="M 190 59 l 12 10 l -12 10" />
      <circle className="ink-mark-dot" cx={154} cy={69} r={3.5} />
    </svg>
  );
}

export default function WorkflowStory() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      scope.querySelectorAll<SVGGeometryElement>(".bento-draw").forEach((element) => {
        const length = element.getTotalLength();
        element.style.strokeDasharray = String(length);
        element.style.strokeDashoffset = String(length);
      });

      gsap.to(scope.querySelectorAll(".bento-card"), {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power3.out",
        startAt: { autoAlpha: 0, y: 30 },
        scrollTrigger: { trigger: scope.querySelector(".bento-grid"), start: "top 85%", once: true },
      });

      gsap.to(scope.querySelectorAll(".bento-draw"), {
        strokeDashoffset: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power2.inOut",
        scrollTrigger: { trigger: scope.querySelector(".bento-grid"), start: "top 82%", once: true },
      });

      gsap.fromTo(
        scope.querySelectorAll(".bento-file"),
        { autoAlpha: 0, x: -12 },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.16,
          ease: "power2.out",
          scrollTrigger: { trigger: scope.querySelector(".bento-grid"), start: "top 82%", once: true },
        },
      );
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="section brief-bento"
      id="how-it-works"
      aria-labelledby="process-title"
    >
      <div className="shell">
        <div className="bento-heading" data-gsap="group">
          <h2 className="bento-title" id="process-title" data-gsap-item>
            Three steps to a brief worth building on.
          </h2>
          <p className="bento-lede" data-gsap-item>
            AnyMD turns a rough product idea into focused answers and three
            Markdown files your coding agent can execute.
          </p>
        </div>
        <div className="bento-grid">
          {cards.map((card) => (
            <article key={card.title} className="bento-card" tabIndex={0}>
              <div className="bento-visual">
                {card.visual === "draft" ? <DraftVisual /> : null}
                {card.visual === "questions" ? <QuestionsVisual /> : null}
                {card.visual === "handoff" ? <HandoffVisual /> : null}
              </div>
              <div className="bento-copy">
                <p className="bento-kicker">{card.step}</p>
                <h3>{card.title}</h3>
                <svg className="bento-underline" viewBox="0 0 240 12" preserveAspectRatio="none" focusable="false" aria-hidden="true">
                  <path className="bento-draw" d="M 3 8 C 70 3, 150 3, 237 7" />
                </svg>
                <p>{card.body}</p>
              </div>
            </article>
          ))}

          <article className="bento-card bento-card-wide" tabIndex={0}>
            <div className="bento-copy">
              <p className="bento-kicker">Guidance, separated</p>
              <h3>Guidance is not tool access.</h3>
              <div className="bento-split">
                <div>
                  <h4>Skills</h4>
                  <p>
                    Local task guidance. Check whether it is installed, then
                    use it when relevant.
                  </p>
                </div>
                <div>
                  <h4>MCP connections</h4>
                  <p>
                    Access to external tools and services. Verify availability
                    and permissions in the coding environment.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="bento-card" id="visual-direction" tabIndex={0}>
            <div className="bento-copy">
              <p className="bento-kicker">Visual direction</p>
              <h3>One preset, chosen once.</h3>
              <p>
                Pick a theme in clarification so the brief carries concrete
                type and color roles. Your agent builds the interface.
              </p>
              <ul className="bento-swatches">
                {themePresets.map((preset) => (
                  <li key={preset.id} className="bento-swatch">
                    <span className="bento-swatch-dots" aria-hidden="true">
                      <i style={{ background: preset.colors.canvas }} />
                      <i style={{ background: preset.colors.primary }} />
                    </span>
                    <span>{preset.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
