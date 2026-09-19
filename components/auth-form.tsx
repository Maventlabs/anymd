"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Github } from "lucide-react";

type AuthFormProps = {
  mode: "login" | "signup";
  googleEnabled: boolean;
  githubEnabled: boolean;
};

export default function AuthForm({
  mode,
  googleEnabled,
  githubEnabled,
}: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
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
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error("Email or password is incorrect");
      router.push("/");
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

  return (
    <main className="auth-page">
      <div className="auth-backdrop" aria-hidden="true" />
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-back" href="/">
          <ArrowLeft aria-hidden="true" /> Back to AnyMD
        </Link>
        <div className="auth-kicker">AnyMD / Maventlabs</div>
        <h1 id="auth-title">{isSignup ? "Make room for the idea." : "Welcome back."}</h1>
        <p className="auth-intro">
          {isSignup
            ? "Create an account to keep your product thinking close and ready to move."
            : "Pick up where your next build begins. Your drafts stay yours."}
        </p>

        <form className="auth-form" onSubmit={submit}>
          {isSignup && (
            <label>
              Name <input name="name" type="text" autoComplete="name" placeholder="Your name" />
            </label>
          )}
          <label>
            Email <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </label>
          <label>
            Password <input name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} required minLength={8} placeholder="8 characters minimum" />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={pending} type="submit">
            {pending ? "Working…" : isSignup ? "Create account" : "Log in"}
            <ArrowUpRight aria-hidden="true" />
          </button>
        </form>

        {(googleEnabled || githubEnabled) && (
          <>
            <div className="auth-divider"><span>or continue with</span></div>
            <div className="auth-providers">
              {googleEnabled && <button type="button" onClick={() => void signIn("google", { callbackUrl: "/" })}>Google</button>}
              {githubEnabled && <button type="button" onClick={() => void signIn("github", { callbackUrl: "/" })}><Github aria-hidden="true" /> GitHub</button>}
            </div>
          </>
        )}

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New to AnyMD?"}{" "}
          <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Create one"}</Link>
        </p>
      </section>
    </main>
  );
}
