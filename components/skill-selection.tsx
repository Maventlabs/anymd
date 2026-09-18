"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, RefreshCw } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import { useDraft } from "@/components/draft-provider";
import {
  completedQuestions,
  visibleQuestions,
} from "@/lib/clarification";
import { validateIdea } from "@/lib/idea";
import {
  recommendSkillIds,
  type CatalogResult,
  type SkillCategory,
} from "@/lib/skills";

const categories: Array<{ id: SkillCategory; label: string }> = [
  { id: "architecture-quality", label: "Architecture & Code Quality" },
  { id: "ui-ux-design", label: "UI/UX & Design System" },
  { id: "motion-3d", label: "Animation, Motion & 3D" },
  { id: "research-content", label: "Research & Content" },
];

function isCatalogResult(value: unknown): value is CatalogResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<CatalogResult>;
  return (
    Array.isArray(result.data) &&
    !!result.meta &&
    (result.meta.source === "remote" || result.meta.source === "snapshot")
  );
}

export default function SkillSelection() {
  const { draft, setDraft, clarification } = useDraft();
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogResult | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [complete, setComplete] = useState(false);
  const questions = visibleQuestions(clarification.answers);
  const validDraft =
    draft.step === "clarification" &&
    !validateIdea(draft.idea) &&
    clarification.current === "review" &&
    completedQuestions(clarification) === questions.length;

  useEffect(() => {
    if (!validDraft) return;
    const controller = new AbortController();
    fetch("/api/skills", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalog request failed");
        const value: unknown = await response.json();
        if (!isCatalogResult(value)) throw new Error("Invalid catalog response");
        setError(false);
        setCatalog(value);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError"))
          setError(true);
      });
    return () => controller.abort();
  }, [retry, validDraft]);

  if (!validDraft)
    return (
      <div className="skills-shell shell">
        <header className="nav">
          <Link href="/" className="wordmark" aria-label="AnyMD home">
            <BrandLogo className="wordmark-image" />
          </Link>
        </header>
        <main className="skills-empty">
          <span className="quiet">03 / Skills</span>
          <h1>Start with your idea first.</h1>
          <p>
            Skill recommendations belong to a completed clarification in this tab. A
            refresh clears the draft, so begin again from the idea composer.
          </p>
          <Link href="/" className="pill">
            Write an idea <ArrowRight aria-hidden="true" />
          </Link>
        </main>
      </div>
    );

  const skills = catalog?.data ?? [];
  const recommendedIds = catalog
    ? recommendSkillIds(skills, {
        idea: draft.idea,
        stack: draft.stack,
        answers: clarification.answers,
      })
    : [];
  const recommended = skills.filter(({ id }) => recommendedIds.includes(id));

  return (
    <div className="skills-shell shell">
      <a href="#skills-main" className="skip-link">
        Skip to skills
      </a>
      <header className="nav">
        <Link href="/" className="wordmark" aria-label="AnyMD home">
          <BrandLogo className="wordmark-image" />
        </Link>
        <span className="quiet">Know-how, matched to the brief.</span>
      </header>
      <main id="skills-main" className="skills-main">
        {complete ? (
          <section className="skills-complete" aria-labelledby="skills-complete-title">
            <span className="quiet">03 / Skills complete</span>
            <h1 id="skills-complete-title">Recommendations saved for this tab.</h1>
            <p>
              {recommended.length
                ? `${recommended.length} recommended skill${recommended.length === 1 ? "" : "s"} will guide the future AGENTS.md instructions.`
                : "No matching skills were recommended. That is valid; the future output will follow repository conventions."}
            </p>
            {recommended.length ? (
              <ul className="selected-skill-list">
                {recommended.map((skill) => (
                  <li key={skill.id}>{skill.name}</li>
                ))}
              </ul>
            ) : null}
            <aside className="skills-phase-note">
              The configured AI provider will refine a structured PRD and AGENTS.md
              from the answers saved in this tab.
            </aside>
            <div className="skills-actions">
              <button className="pill" onClick={() => setComplete(false)}>
                <ArrowLeft aria-hidden="true" /> Review recommendations
              </button>
              <button className="pill" onClick={() => router.push("/generate")}>
                Generate documents <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </section>
        ) : (
          <>
            <div className="skills-heading">
              <div>
                <span className="quiet">03 / Skill recommendations</span>
                <h1>Recommended for this build.</h1>
              </div>
              <p>
                AnyMD matches the current brief to its curated catalog. Your coding
                agent must still check whether each skill is installed; a skill
                never proves MCP access.
              </p>
            </div>

            {catalog?.meta.source === "snapshot" ? (
              <p className="catalog-notice" role="status">
                Showing the verified fallback catalog because the live structured
                catalog is not available yet.
              </p>
            ) : null}

            {!catalog && !error ? (
              <p className="catalog-loading" role="status">
                Loading the curated catalog...
              </p>
            ) : null}

            {error ? (
              <div className="catalog-error" role="alert">
                <p>The catalog could not be loaded. Your draft remains safe.</p>
                <button
                  className="pill"
                  onClick={() => {
                    setError(false);
                    setRetry((value) => value + 1);
                  }}
                >
                  <RefreshCw aria-hidden="true" /> Retry
                </button>
              </div>
            ) : null}

            {catalog
              ? categories.map((category) => {
                  const categorySkills = recommended.filter(
                    (skill) => skill.category === category.id,
                  );
                  return categorySkills.length ? (
                  <fieldset className="skill-category" key={category.id}>
                    <legend>{category.label}</legend>
                    <div className="skill-grid">
                      {categorySkills.map((skill) => (
                            <article className="skill-card" key={skill.id}>
                              <span className="skill-check" aria-hidden="true">
                                <Check />
                              </span>
                              <strong>{skill.name}</strong>
                              <span>{skill.description}</span>
                              <small>{skill.sourceRepo}</small>
                            </article>
                          ))}
                    </div>
                  </fieldset>
                  ) : null;
                })
              : null}

            <div className="skills-actions">
              <button className="pill" onClick={() => router.push("/clarify")}>
                <ArrowLeft aria-hidden="true" /> Back to review
              </button>
              <span aria-live="polite">
                {recommended.length} recommended
              </span>
              <button
                className="pill"
                disabled={!catalog}
                onClick={() => {
                  setDraft((state) => ({
                    ...state,
                    selectedSkillIds: recommendedIds,
                  }));
                  setComplete(true);
                }}
              >
                Continue with recommendations <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </main>
      <p className="clarify-privacy">
        Saved only in this tab. Nothing is installed and no MCP connection is
        assumed.
      </p>
    </div>
  );
}
