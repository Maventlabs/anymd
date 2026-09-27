"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  Check,
  Cloud,
  CreditCard,
  Database,
  HardDrive,
  KeyRound,
  LayoutTemplate,
  LockKeyhole,
  Server,
  Sparkles,
} from "lucide-react";
import {
  SiAdyen,
  SiAngular,
  SiAstro,
  SiAuth0,
  SiBetterauth,
  SiBraintree,
  SiClerk,
  SiCloudflareworkers,
  SiCockroachlabs,
  SiDjango,
  SiDotnet,
  SiFastapi,
  SiFirebase,
  SiFlydotio,
  SiGo,
  SiGooglecloud,
  SiHono,
  SiHtmx,
  SiKeycloak,
  SiLaravel,
  SiLemonsqueezy,
  SiMercadopago,
  SiMongodb,
  SiNodedotjs,
  SiNestjs,
  SiNetlify,
  SiNextdotjs,
  SiPaddle,
  SiPaypal,
  SiPlanetscale,
  SiPostgresql,
  SiQwik,
  SiRailway,
  SiReact,
  SiRender,
  SiRemix,
  SiRubyonrails,
  SiSolid,
  SiSpringboot,
  SiSqlite,
  SiStripe,
  SiSupabase,
  SiSvelte,
  SiTurso,
  SiVercel,
  SiVuedotjs,
  SiXendit,
} from "@icons-pack/react-simple-icons";
import BrandLogo from "@/components/brand-logo";
import PageMotion from "@/components/page-motion";
import { useDraft } from "@/components/draft-provider";
import { trackAnalytics } from "@/lib/analytics-client";
import { useStageMotion } from "@/components/use-stage-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  clarificationProgress,
  completedQuestions,
  updateAnswer,
  validateAnswer,
  visibleQuestions,
  type QuestionId,
} from "@/lib/clarification";
import {
  getRecommendedStack,
  hasCompleteStack,
  stackCategories,
  stackOptionIcons,
  stackOptions,
  isCustomStackChoice,
  validateIdea,
  type StackCategory,
} from "@/lib/idea";
import { getThemePreset, themePresets } from "@/lib/themes";

export default function ClarificationFlow() {
  const { draft, clarification, setDraft, setClarification } = useDraft();
  const router = useRouter();
  const questions = visibleQuestions(clarification.answers);
  const validDraft =
    draft.step === "clarification" && !validateIdea(draft.idea);
  const stackComplete = hasCompleteStack(draft.stack);
  const complete = completedQuestions(clarification) === questions.length && stackComplete;
  const stacking = clarification.current === "stack";
  const reviewing = clarification.current === "review" && complete;
  const question =
    questions.find(({ id }) => id === clarification.current) ??
    questions.find((q) => !clarification.completed.includes(q.id)) ??
    questions[0];
  const index = questions.findIndex(({ id }) => id === question.id);
  const stageKey = !validDraft ? "empty" : reviewing ? "review" : stacking ? "stack" : question.id;
  const { stage, busy, leave } = useStageMotion(stageKey);
  const [error, setError] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState<StackCategory | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const previousProgress = useRef(0);
  const progress = validDraft ? clarificationProgress(clarification) : 0;
  const answer = clarification.answers[question.id] ?? "";

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    const ctx = gsap.context(() => {
      media.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          normal: "(prefers-reduced-motion: no-preference)",
        },
        (match) => {
          if (line.current)
            gsap.fromTo(
              line.current,
              { scaleX: previousProgress.current / 100 },
              {
                scaleX: progress / 100,
                duration: match.conditions?.reduce ? 0 : 0.3,
                ease: "power2.out",
              },
            );
          previousProgress.current = progress;
        },
      );
    });
    return () => {
      media.revert();
      ctx.revert();
    };
  }, [progress]);

  function goTo(id: QuestionId | "stack" | "review") {
    leave(() => {
      setError(null);
      setClarification((state) => ({ ...state, current: id }));
    });
  }

  return (
    <PageMotion className="clarify-motion-root">
    <div className="clarify-shell shell">
      <a href="#clarification-main" className="skip-link">
        Skip to questions
      </a>
      <header className="nav workflow-header" data-gsap="reveal">
        <Link
          href="/"
          className="wordmark"
          onNavigate={(event) => {
            event.preventDefault();
            leave(() => router.push("/"));
          }}
        >
          <BrandLogo className="wordmark-image" />
        </Link>
         <span className="quiet">Answer the decisions that shape the build.</span>
      </header>
      <main
        id="clarification-main"
        className={`clarify-main${validDraft ? " is-active" : " is-empty"}`}
      >
        {validDraft ? (
          <aside className="clarify-journey-rail" aria-label="Brief progress" data-gsap="reveal">
            <p className="clarify-journey-title">Your brief</p>
            <ol>
              <li className="is-complete"><span>01</span><strong>Idea</strong></li>
              <li aria-current="step"><span>02</span><strong>Clarify</strong></li>
              <li><span>03</span><strong>Skills</strong></li>
              <li><span>04</span><strong>Documents</strong></li>
            </ol>
            <p className="clarify-journey-note">A focused question at a time. Review everything before the handoff.</p>
          </aside>
        ) : null}
        <div className="clarify-meta">
           <span>02 / Clarify the brief</span>
          <span>
            {reviewing
              ? "Ready to review"
              : validDraft
                ? `${completedQuestions(clarification)} of ${questions.length} answers saved`
                : "Start with an idea"}
          </span>
        </div>
        <div
          className="clarify-progress"
          role="progressbar"
             aria-label="Brief completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div ref={line} className="clarify-progress-line" />
        </div>
        <div ref={stage} className="clarify-stage" aria-busy={busy}>
          {!validDraft ? (
            <>
              <h1 tabIndex={-1} data-stage-heading>
                 Describe your product first.
              </h1>
              <p>
                 There is no idea in this browser yet. Add your idea on the home
                 page to begin.
              </p>
              <Link
                href="/"
                className="pill"
                onNavigate={(event) => {
                  event.preventDefault();
                  leave(() => router.push("/"));
                }}
              >
                Write an idea <ArrowRight aria-hidden="true" />
              </Link>
            </>
           ) : stacking ? (
             <form
               noValidate
               onSubmit={(event) => {
                 event.preventDefault();
                 if (busy) return;
                 const manual = clarification.answers["stack-mode"] === "Manual selection";
                 if (manual && !hasCompleteStack(draft.stack)) {
                   setError("Choose one option for each stack category before continuing.");
                   return;
                 }
                 setError(null);
                 leave(() => {
                   setClarification((state) => ({
                     ...state,
                     current:
                       questions.find((item) => !state.completed.includes(item.id))?.id ??
                       "review",
                   }));
                 });
               }}
             >
               <span className="quiet">03 / Shape the build</span>
               <h1 tabIndex={-1} data-stage-heading>
                 {clarification.answers["stack-mode"] === "Manual selection"
                   ? "Choose the tools behind it."
                   : "Here is a considered starting stack."}
               </h1>
               <p>
                 {clarification.answers["stack-mode"] === "Manual selection"
                   ? "Choose one named option per category. Open keeps the decision deliberately flexible."
                   : "This recommendation is based on the product type and release scale. Every choice remains editable."}
               </p>
               <div className="stack-builder" aria-label="Technology stack choices">
                 {stackCategories.map((category) => (
                   <section className="stack-category" key={category} aria-labelledby={`stack-${category}`}>
                     <div className="stack-category-heading">
                       <h2 id={`stack-${category}`}>{category}</h2>
                       <span>{draft.stack[category] || "Choose one"}</span>
                     </div>
                     <div className="stack-options" role="group" aria-label={`${category} options`}>
                        {stackOptions[category].map((option) => {
                          const selected = option === "Custom"
                            ? customCategory === category ||
                              isCustomStackChoice(category, draft.stack[category] ?? "")
                            : draft.stack[category] === option;
                         return (
                           <button
                             type="button"
                             className={`stack-option${selected ? " is-selected" : ""}`}
                             key={option}
                             aria-pressed={selected}
                              onClick={() => {
                                setError(null);
                                if (option === "Custom") {
                                  setCustomCategory(category);
                                  setDraft((state) => ({
                                    ...state,
                                    stack: { ...state.stack, [category]: "" },
                                  }));
                                  return;
                                }
                                setCustomCategory(null);
                                setDraft((state) => ({
                                  ...state,
                                  stack: { ...state.stack, [category]: option },
                                }));
                              }}
                            >
                             <StackIcon category={category} option={option} />
                             <span>{option}</span>
                             {selected ? <Check aria-hidden="true" /> : null}
                            </button>
                          );
                        })}
                      </div>
                      {customCategory === category ||
                      isCustomStackChoice(category, draft.stack[category] ?? "") ? (
                        <div className="stack-custom-field">
                          <label htmlFor={`custom-stack-${category}`}>
                            Name your {category.toLowerCase()} choice
                          </label>
                          <input
                            id={`custom-stack-${category}`}
                            className="text-input"
                            value={
                              isCustomStackChoice(category, draft.stack[category] ?? "")
                                ? draft.stack[category]
                                : ""
                            }
                            maxLength={80}
                            placeholder="e.g. Drizzle ORM"
                            onChange={(event) => {
                              setError(null);
                              setDraft((state) => ({
                                ...state,
                                stack: { ...state.stack, [category]: event.target.value },
                              }));
                            }}
                          />
                        </div>
                      ) : null}
                    </section>
                 ))}
               </div>
               {error ? <p role="alert" className="error">{error}</p> : null}
               <div className="clarify-actions">
                 <button type="button" className="pill" disabled={busy} onClick={() => goTo("stack-mode")}>
                   <ArrowLeft aria-hidden="true" /> Back
                 </button>
                 <button type="submit" className="pill" disabled={busy}>
                   Continue to questions <ArrowRight aria-hidden="true" />
                 </button>
               </div>
             </form>
           ) : reviewing ? (
            <>
              <h1 tabIndex={-1} data-stage-heading>
                 Review your brief.
              </h1>
              <p>
                 Review the details below. Everything stays editable in this
                 browser until you submit it.
              </p>
              <section className="review-item" aria-labelledby="review-idea">
                <div className="review-label">
                  <h2 id="review-idea">Starting idea</h2>
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() => leave(() => router.push("/"))}
                  >
                    Edit idea
                  </button>
                </div>
                <p>{draft.idea}</p>
                 <dl className="retained-stack">
                   {Object.keys(stackOptions).map((category) => (
                     <div key={category}>
                       <dt>{category}</dt>
                       <dd>
                         <StackIcon
                           category={category as StackCategory}
                           option={draft.stack[category as keyof typeof stackOptions] ?? "Open"}
                         />
                         {draft.stack[category as keyof typeof stackOptions] ||
                           "No preference"}
                       </dd>
                    </div>
                  ))}
                </dl>
              </section>
              {questions.map((item) => (
                <section
                  key={item.id}
                  className="review-item"
                  aria-labelledby={`review-${item.id}`}
                >
                  <div className="review-label">
                    <h2 id={`review-${item.id}`}>{item.title}</h2>
                    <button
                      className="text-link"
                      disabled={busy}
                      aria-label={`Edit: ${item.title}`}
                      onClick={() => goTo(item.id)}
                    >
                      Edit
                    </button>
                  </div>
                  <p>
                    {(item.id === "theme"
                      ? getThemePreset(clarification.answers[item.id])?.name
                      : clarification.answers[item.id]?.trim()) ||
                       "No constraint provided"}
                  </p>
                </section>
              ))}
              <aside className="clarify-next">
                <h2>Next: review the recommended skills</h2>
                <p>
                  Review the skills recommended from your idea, stack, and answers.
                  No AI has been called and no documents have been generated.
                </p>
              </aside>
              <div className="clarify-actions">
                <button
                  className="pill"
                  disabled={busy}
                  onClick={() => goTo(questions[questions.length - 1].id)}
                >
                  <ArrowLeft aria-hidden="true" /> Back to questions
                </button>
                <button
                  className="pill"
                  disabled={busy}
                  onClick={() => {
                    trackAnalytics("clarification_completed", {
                      answer_count: completedQuestions(clarification),
                    });
                    trackAnalytics("stack_selected", {
                      stack_count: Object.values(draft.stack).filter(Boolean).length,
                    });
                    leave(() => router.push("/skills"));
                  }}
                >
                  Review recommended skills <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                if (busy) return;
                 const message = validateAnswer(question, answer);
                setError(message);
                if (message) {
                  if (question.options)
                    stage.current
                      ?.querySelector<HTMLElement>('[role="radio"]')
                      ?.focus();
                  else field.current?.focus();
                  return;
                }
                 leave(() => {
                   setError(null);
                   if (question.id === "stack-mode" && answer === "Automatic recommendation") {
                     setDraft((draftState) => ({
                       ...draftState,
                       stack: getRecommendedStack(
                         clarification.answers["product-type"] as "Website" | "Web App" | "Mobile App",
                         clarification.answers.scale as "MVP" | "Production product" | "Complex platform",
                       ),
                     }));
                   }
                   setClarification((state) => {
                    const completed = Array.from(
                      new Set([...state.completed, question.id]),
                    );
                     const next =
                       question.id === "stack-mode"
                         ? "stack"
                         : questions[index + 1]?.id ??
                       questions.find(
                        (item) =>
                          !completed.includes(item.id) ||
                          validateAnswer(item, state.answers[item.id]),
                      )?.id ??
                      "review";
                     return { ...state, completed, current: next };
                   });
                 });
              }}
            >
              <span className="quiet">
                Question {index + 1} of {questions.length}
                {question.optional ? " / Optional" : ""}
              </span>
              <h1 tabIndex={-1} data-stage-heading id="question-heading">
                {question.title}
              </h1>
              <p id="question-help">{question.help}</p>
              <fieldset
                disabled={busy}
                aria-describedby={`question-help${error ? " answer-error" : ""}`}
              >
                <legend className="sr-only">{question.title}</legend>
                {question.id === "theme" ? (
                  <RadioGroup
                    name={question.id}
                    value={answer}
                    className="theme-grid"
                    aria-labelledby="question-heading"
                    aria-describedby={`question-help${error ? " answer-error" : ""}`}
                    aria-invalid={!!error}
                    onValueChange={(value) => {
                      setError(null);
                      setClarification((state) =>
                        updateAnswer(state, question.id, value),
                      );
                    }}
                  >
                    {themePresets.map((preset) => (
                      <label
                        className="theme-card"
                        key={preset.id}
                        htmlFor={`theme-${preset.id}`}
                        style={
                          {
                            "--theme-canvas": preset.colors.canvas,
                            "--theme-surface": preset.colors.surface,
                            "--theme-text": preset.colors.text,
                            "--theme-primary": preset.colors.primary,
                            "--theme-accent": preset.colors.accent,
                            "--theme-border": preset.colors.border,
                          } as CSSProperties
                        }
                      >
                        <RadioGroupItem
                          id={`theme-${preset.id}`}
                          value={preset.id}
                          disabled={busy}
                        />
                        <span className="theme-preview" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                        <strong>{preset.name}</strong>
                        <span>{preset.description}</span>
                        <small>
                          {preset.fonts.display} / {preset.fonts.body}
                        </small>
                      </label>
                    ))}
                  </RadioGroup>
                ) : question.options ? (
                  <RadioGroup
                    name={question.id}
                    value={answer}
                    aria-labelledby="question-heading"
                    aria-describedby={`question-help${error ? " answer-error" : ""}`}
                    aria-invalid={!!error}
                    onValueChange={(value) => {
                      setError(null);
                      if (question.id === "stack-mode" && value === "Manual selection") {
                        setDraft((state) => ({ ...state, stack: {} }));
                      }
                      setClarification((state) =>
                        updateAnswer(state, question.id, value),
                      );
                    }}
                  >
                    {question.options.map((option, i) => (
                      <div key={option} className="clarify-option">
                        <RadioGroupItem
                          id={`${question.id}-${i}`}
                          value={option}
                          disabled={busy}
                        />
                        <label htmlFor={`${question.id}-${i}`}>{option}</label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <>
                    <label
                      className="sr-only"
                      htmlFor={`answer-${question.id}`}
                    >
                      {question.title}
                    </label>
                    <textarea
                      ref={field}
                      id={`answer-${question.id}`}
                      rows={5}
                      value={answer}
                      aria-invalid={!!error}
                      aria-describedby={`question-help answer-count${error ? " answer-error" : ""}`}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (error) setError(validateAnswer(question, value));
                        setClarification((state) =>
                          updateAnswer(state, question.id, value),
                        );
                      }}
                    />
                    <p id="answer-count" className="answer-count">
                      {Array.from(answer.trim()).length.toLocaleString("en-US")}{" "}
                      / 2,000 characters
                      {question.optional
                        ? " / Blank is fine"
                        : ` / At least ${question.minLength ?? 10}`}
                    </p>
                  </>
                )}
              </fieldset>
              {error ? (
                <p role="alert" id="answer-error" className="error">
                  {error}
                </p>
              ) : null}
              <div className="clarify-actions">
                <button
                  type="button"
                  className="pill"
                  disabled={busy}
                  onClick={() =>
                    index === 0
                      ? leave(() => router.push("/"))
                      : goTo(questions[index - 1].id)
                  }
                >
                  <ArrowLeft aria-hidden="true" />{" "}
                  {index === 0 ? "Edit idea" : "Back"}
                </button>
                <button type="submit" className="pill" disabled={busy}>
                  {index === questions.length - 1 ? "Review answers" : "Next"}
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
              {complete ? (
                <button
                  type="button"
                  className="text-link review-return"
                  disabled={busy}
                  onClick={() => goTo("review")}
                >
                  Return to review
                </button>
              ) : null}
            </form>
          )}
        </div>
        {validDraft ? (
          <aside className="clarify-context-panel" aria-label="Current product context" data-gsap="reveal">
            <div className="clarify-context-status">
              <span>Current brief</span>
              <span><LockKeyhole aria-hidden="true" /> Saved locally</span>
            </div>
            <h2>Starting idea</h2>
            <p className="clarify-context-idea">{draft.idea}</p>
            {Object.values(draft.stack).some(Boolean) ? (
              <dl className="clarify-context-stack">
                {Object.keys(stackOptions).map((category) => {
                  const selected = draft.stack[category as keyof typeof stackOptions];
                  if (!selected) return null;
                  return (
                    <div key={category}>
                      <dt>{category}</dt>
                      <dd>{selected}</dd>
                    </div>
                  );
                })}
              </dl>
            ) : null}
            <p className="clarify-context-note">Nothing goes to the AI provider until you continue to generation.</p>
          </aside>
        ) : null}
        <p className="clarify-privacy">
           Saved locally in this browser. Nothing is sent to an AI provider until
           you continue to generation.
          Nothing is sent to an AI provider.
        </p>
      </main>
    </div>
    </PageMotion>
  );
}

function StackIcon({ category, option }: { category: StackCategory; option: string }) {
  const icon = stackOptionIcons[category][option] ??
    (isCustomStackChoice(category, option) ? "custom" : `category-${category.toLowerCase()}`);
  const fallback =
    icon === "category-backend" ? Server
      : icon === "category-database" ? Database
        : icon === "category-auth" ? KeyRound
          : icon === "category-payments" ? CreditCard
            : icon === "category-hosting" ? Cloud
              : icon === "custom" ? Sparkles
                : icon === "open" ? Blocks
                  : icon === "category-frontend" ? LayoutTemplate
                    : HardDrive;
  const icons: Record<string, typeof SiReact> = {
    SiAdyen,
    SiAngular,
    SiAstro,
    SiAuth0,
    SiBetterauth,
    SiBraintree,
    SiClerk,
    SiCloudflareworkers,
    SiCockroachlabs,
    SiDjango,
    SiDotnet,
    SiFastapi,
    SiFirebase,
    SiFlydotio,
    SiGo,
    SiGooglecloud,
    SiHono,
    SiHtmx,
    SiKeycloak,
    SiLaravel,
    SiLemonsqueezy,
    SiMercadopago,
    SiMongodb,
    SiNodedotjs,
    SiNestjs,
    SiNetlify,
    SiNextdotjs,
    SiPaddle,
    SiPaypal,
    SiPlanetscale,
    SiPostgresql,
    SiQwik,
    SiRailway,
    SiReact,
    SiRender,
    SiRemix,
    SiRubyonrails,
    SiSolid,
    SiSpringboot,
    SiSqlite,
    SiStripe,
    SiSupabase,
    SiSvelte,
    SiTurso,
    SiVercel,
    SiVuedotjs,
    SiXendit,
  };
  const Icon = icons[icon];
  const FallbackIcon = fallback;
  return Icon ? (
    <Icon className="stack-option-icon" aria-hidden="true" />
  ) : (
    <FallbackIcon className="stack-option-icon" aria-hidden="true" />
  );
}
