"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  ChevronDown,
  LockKeyhole,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useDraft } from "@/components/draft-provider";
import { useStageMotion } from "@/components/use-stage-motion";
import { starters, stackOptions, validateIdea } from "@/lib/idea";

const stackIcons: Record<string, string> = {
  "Next.js": "nextdotjs",
  "Vue/Nuxt": "vuedotjs",
  SvelteKit: "svelte",
  Astro: "astro",
  "Node.js/Express": "nodedotjs",
  FastAPI: "fastapi",
  "Go (Fiber/Gin)": "go",
  NestJS: "nestjs",
  Neon: "neon",
  Supabase: "supabase",
  PlanetScale: "planetscale",
  "MongoDB Atlas": "mongodb",
  "Self-managed Postgres": "postgresql",
  Clerk: "clerk",
  Auth0: "auth0",
  "Supabase Auth": "supabase",
  "NextAuth/Auth.js": "auth0",
  Stripe: "stripe",
  Xendit: "x",
  Paddle: "paddle",
  LemonSqueezy: "lemonsqueezy",
  Vercel: "vercel",
  Railway: "railway",
  "Fly.io": "flydotio",
  "Self-host/VPS": "linux",
};

export default function IdeaWizard() {
  const { draft, setDraft, submitIdea } = useDraft();
  const router = useRouter();
  const { stage, busy, leave } = useStageMotion("idea");
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const stackPicker = useRef<HTMLDetailsElement>(null);
  const count = Array.from(draft.idea.trim()).length;
  const selectedCount = Object.values(draft.stack).filter(Boolean).length;

  return (
    <div
      ref={stage}
      className="wizard"
      id="idea"
      data-interactive
      aria-busy={busy}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (busy) return;
          const message = validateIdea(draft.idea);
          setError(message);
          if (message) input.current?.focus();
          else {
            leave(() => {
              submitIdea();
              router.push("/clarify");
            });
          }
        }}
      >
        <div className="composer-heading">
          <span>
            <Sparkles aria-hidden="true" /> Start with the messy version
          </span>
          <span>Any language</span>
        </div>
        <div className="composer-input">
          <label htmlFor="product-idea" className="sr-only">
            Describe your product idea
          </label>
          <textarea
            ref={input}
            disabled={busy}
            id="product-idea"
            value={draft.idea}
            onChange={(event) => {
              setDraft({ ...draft, idea: event.target.value });
              if (error) setError(validateIdea(event.target.value));
            }}
            placeholder="I want to build a place where..."
            aria-invalid={!!error}
            aria-describedby={`idea-help${error ? " idea-error" : ""}`}
            rows={2}
          />
          <div className="composer-toolbar">
            <div className="composer-tools">
              <details ref={stackPicker} className="stack-picker">
                <summary>
                  <SlidersHorizontal aria-hidden="true" />
                  Advanced
                  {selectedCount > 0 && (
                    <span className="selection-count">{selectedCount}</span>
                  )}
                  <ChevronDown aria-hidden="true" />
                </summary>
                <div className="stack-panel">
                  <div className="stack-panel-heading">
                    <div>
                      <strong>Tech preferences</strong>
                      <p>Choose only what is already decided.</p>
                    </div>
                    <div className="stack-panel-actions">
                      <span>{selectedCount}/6 selected</span>
                      <button
                        type="button"
                        className="stack-panel-close"
                        aria-label="Close tech preferences"
                        onClick={() => stackPicker.current?.removeAttribute("open")}
                      >
                        <X aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="stack-rows">
                    {Object.entries(stackOptions).map(([category, options]) => (
                      <div className="stack-row" key={category}>
                        <span className="stack-category">{category}</span>
                        <div
                          className="stack-options"
                          role="group"
                          aria-label={category}
                        >
                          {["", ...options].map((option) => {
                            const selected =
                              (draft.stack[
                                category as keyof typeof stackOptions
                              ] ?? "") === option;
                            return (
                              <button
                                type="button"
                                className="stack-option"
                                key={option || "none"}
                                disabled={busy}
                                aria-pressed={selected}
                                onClick={() =>
                                  setDraft({
                                    ...draft,
                                    stack: {
                                      ...draft.stack,
                                      [category]: option,
                                    },
                                  })
                                }
                              >
                                {option ? (
                                  // Small provider marks are decorative beside visible labels.
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={`https://cdn.simpleicons.org/${stackIcons[option]}/006eff`}
                                    alt=""
                                    width="16"
                                    height="16"
                                  />
                                ) : (
                                  <span
                                    className="stack-open-mark"
                                    aria-hidden="true"
                                  />
                                )}
                                {option || "Open"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
              <span className="privacy-chip">
                <LockKeyhole aria-hidden="true" /> This tab only
              </span>
            </div>
            <button
              className="send-button"
              type="submit"
              disabled={busy}
              aria-label="Shape my idea"
            >
              <ArrowUp aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="input-meta">
          <span id="idea-help">20 characters minimum. No perfect brief required.</span>
          <span>{count.toLocaleString("en-US")} / 5,000</span>
        </div>
        {error && (
          <p id="idea-error" role="alert" className="error">
            {error}
          </p>
        )}
        <div className="starter-prompts" aria-label="Starter ideas">
          <span>Try a starting point</span>
          <div>
            {starters.map((starter) => (
              <button
                type="button"
                key={starter.title}
                disabled={busy}
                onClick={() => {
                  setDraft({ ...draft, idea: starter.idea, step: "idea" });
                  setError(null);
                  requestAnimationFrame(() => input.current?.focus());
                }}
              >
                {starter.title}
              </button>
            ))}
          </div>
        </div>
      </form>
      <p className="prototype-note">
        Fase 1 interface. Continue to the existing clarification preview; skill
        selection and generation arrive later.
      </p>
    </div>
  );
}
