"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowUpRight, Github } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import PageMotion from "@/components/page-motion";
import { trackAnalytics } from "@/lib/analytics-client";

type AuthFormProps = {
  mode: "login" | "signup";
  googleEnabled: boolean;
  githubEnabled: boolean;
};

type AuthCopy = {
  title: string;
  intro: string;
  submit: string;
  pending: string;
  switch: string;
  switchLink: string;
  brandHeadline: string;
  brandBody: string;
};

const copyByMode: Record<"login" | "signup", AuthCopy> = {
  signup: {
    title: "Start with your idea.",
    intro: "Create an account to save your briefs and continue anytime.",
    submit: "Create account",
    pending: "Creating account…",
    switch: "Already have an account?",
    switchLink: "Sign in",
    brandHeadline: "Bold ideas in. Clear decisions out.",
    brandBody:
      "AnyMD turns scattered product thinking into a brief your coding agent can run with — scope, users, and open questions, settled.",
  },
  login: {
    title: "Welcome back.",
    intro: "Sign in to pick up right where you left off.",
    submit: "Sign in",
    pending: "Signing in…",
    switch: "New to AnyMD?",
    switchLink: "Create one",
    brandHeadline: "Every great build starts clear.",
    brandBody:
      "Your briefs, decisions, and session notes are right where you saved them — ready for the next build.",
  },
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="auth-provider-icon">
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.79-.07-1.55-.23-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
      />
      <path
        fill="#34A853"
        d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.53A9.75 9.75 0 0 0 12 21.5Z"
      />
      <path
        fill="#FBBC05"
        d="M6.53 13.58A5.86 5.86 0 0 1 6.22 12c0-.55.1-1.08.31-1.58V7.89H3.28A9.5 9.5 0 0 0 2.25 12c0 1.48.36 2.88 1.03 4.11l3.25-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.39c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.48 14.63 2.5 12 2.5a9.75 9.75 0 0 0-8.72 5.39l3.25 2.53C7.3 8.11 9.46 6.39 12 6.39Z"
      />
    </svg>
  );
}

export default function AuthForm({
  mode,
  googleEnabled,
  githubEnabled,
}: AuthFormProps) {
  const isSignup = mode === "signup";
  const copy = copyByMode[mode];
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      if (isSignup) {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name: String(formData.get("name") ?? ""),
          }),
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Unable to create account");
        trackAnalytics("signup_completed");
      }

      await signIn("credentials", {
        email,
        password,
        redirect: true,
        redirectTo: "/",
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong",
      );
    } finally {
      setPending(false);
    }
  }

  async function continueWithProvider(provider: "google" | "github") {
    setError(null);
    setPending(true);
    try {
      await signIn(provider, { callbackUrl: "/" });
    } catch (providerError) {
      setError(
        providerError instanceof Error
          ? providerError.message
          : "Unable to continue with this provider",
      );
      setPending(false);
    }
  }

  return (
    <PageMotion className="page-motion-root auth-motion-root" motionKey={mode}>
      <main className={`auth-page ${isSignup ? "auth-page-signup" : "auth-page-login"}`}>
        <aside className="auth-panel auth-panel-brand" aria-label="About AnyMD">
          <div className="auth-brand-top">
            <Link className="auth-brand-home" href="/" aria-label="AnyMD home">
              <BrandLogo className="auth-brand-logo" />
            </Link>
          </div>
          <div className="auth-brand-copy" data-gsap="reveal">
            <p className="auth-brand-kicker">Product thinking, made buildable.</p>
            <h2>{copy.brandHeadline}</h2>
            <p>{copy.brandBody}</p>
          </div>
          <p className="auth-brand-footer">© 2026 Maventlabs</p>
        </aside>

        <section
          className="auth-panel auth-panel-form"
          aria-labelledby="auth-title"
        >
          <div className="auth-form-shell" data-gsap="reveal">
            <p className="auth-eyebrow">AnyMD / Maventlabs</p>
            <h1 id="auth-title">{copy.title}</h1>
            <p className="auth-intro">{copy.intro}</p>

            <form className="auth-form" onSubmit={submit}>
              {isSignup && (
                <label>
                  Name
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                  />
                </label>
              )}
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                />
              </label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="auth-submit" disabled={pending} type="submit">
                {pending ? copy.pending : copy.submit}
                <ArrowUpRight aria-hidden="true" />
              </button>
            </form>

            {(googleEnabled || githubEnabled) && (
              <>
                <div className="auth-divider"><span>or continue with</span></div>
                <div className="auth-providers">
                  {googleEnabled && (
                    <button
                      disabled={pending}
                      type="button"
                      onClick={() => void continueWithProvider("google")}
                    >
                      <GoogleIcon /> Google
                    </button>
                  )}
                  {githubEnabled && (
                    <button
                      disabled={pending}
                      type="button"
                      onClick={() => void continueWithProvider("github")}
                    >
                      <Github aria-hidden="true" /> GitHub
                    </button>
                  )}
                </div>
              </>
            )}

            <p className="auth-switch">
              {copy.switch}{" "}
              <Link href={isSignup ? "/login" : "/signup"}>{copy.switchLink}</Link>
            </p>
          </div>
        </section>
      </main>
    </PageMotion>
  );
}
