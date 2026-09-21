"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ArrowLeft, ArrowRight } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import { useDraft } from "@/components/draft-provider";
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
import { stackOptions, validateIdea } from "@/lib/idea";
import { getThemePreset, themePresets } from "@/lib/themes";

export default function ClarificationFlow() {
  const { draft, clarification, setClarification } = useDraft();
  const router = useRouter();
  const questions = visibleQuestions(clarification.answers);
  const validDraft =
    draft.step === "clarification" && !validateIdea(draft.idea);
  const complete = completedQuestions(clarification) === questions.length;
  const reviewing = clarification.current === "review" && complete;
  const question =
    questions.find(({ id }) => id === clarification.current) ??
    questions.find((q) => !clarification.completed.includes(q.id)) ??
    questions[0];
  const index = questions.findIndex(({ id }) => id === question.id);
  const stageKey = !validDraft ? "empty" : reviewing ? "review" : question.id;
  const { stage, busy, leave } = useStageMotion(stageKey);
  const [error, setError] = useState<string | null>(null);
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

  function goTo(id: QuestionId | "review") {
    leave(() => {
      setError(null);
      setClarification((state) => ({ ...state, current: id }));
    });
  }

  return (
    <div className="clarify-shell shell">
      <a href="#clarification-main" className="skip-link">
        Skip to questions
      </a>
      <header className="nav">
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
      <main id="clarification-main" className="clarify-main">
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
                  onClick={() => leave(() => router.push("/skills"))}
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
                  setClarification((state) => {
                    const completed = Array.from(
                      new Set([...state.completed, question.id]),
                    );
                    const next =
                      questions[index + 1]?.id ??
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
        <p className="clarify-privacy">
           Saved locally in this browser. Nothing is sent to an AI provider until
           you continue to generation.
          Nothing is sent to an AI provider.
        </p>
      </main>
    </div>
  );
}
