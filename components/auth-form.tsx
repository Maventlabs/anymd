"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Github } from "lucide-react";
import BrandLogo from "@/components/brand-logo";

type AuthFormProps = {
  mode: "login" | "signup";
  googleEnabled: boolean;
  githubEnabled: boolean;
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
    <main className={`auth-page ${isSignup ? "auth-page-signup" : "auth-page-login"}`}>
      <section className="auth-panel auth-panel-form" aria-labelledby="auth-title">
        <div className="auth-form-shell">
          <Link className="auth-back" href="/">
            <ArrowLeft aria-hidden="true" /> Kembali ke AnyMD
          </Link>
          <p className="auth-eyebrow">AnyMD / Maventlabs</p>
          <h1 id="auth-title">
            {isSignup ? "Mulai dari idemu." : "Selamat datang kembali."}
          </h1>
          <p className="auth-intro">
            {isSignup
              ? "Buat akun untuk menyimpan brief dan melanjutkan kapan saja."
              : "Masuk untuk melanjutkan pekerjaanmu."}
          </p>

          <form className="auth-form" onSubmit={submit}>
            {isSignup && (
              <label>
                Nama
                <input name="name" type="text" autoComplete="name" placeholder="Nama kamu" />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@contoh.com"
              />
            </label>
            <label>
              Kata sandi
              <input
                name="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                minLength={8}
                placeholder="Minimal 8 karakter"
              />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" disabled={pending} type="submit">
              {pending ? "Memproses…" : isSignup ? "Buat akun" : "Masuk"}
              <ArrowUpRight aria-hidden="true" />
            </button>
          </form>

          {(googleEnabled || githubEnabled) && (
            <>
              <div className="auth-divider"><span>atau lanjutkan dengan</span></div>
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
            {isSignup ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <Link href={isSignup ? "/login" : "/signup"}>
              {isSignup ? "Masuk" : "Daftar gratis"}
            </Link>
          </p>
        </div>
      </section>
      <aside className="auth-panel auth-panel-brand" aria-label="Tentang AnyMD">
        <div className="auth-brand-top">
          <Link href="/" aria-label="AnyMD home">
            <BrandLogo className="auth-brand-logo" />
          </Link>
        </div>
        <div className="auth-brand-copy">
          <p className="auth-brand-kicker">Product thinking, made buildable.</p>
          <h2>Berani mulai dari ide. Tumbuh dari keputusan yang jelas.</h2>
          <p>
            AnyMD membantu merapikan pikiran produk menjadi brief yang siap dipakai
            oleh kamu dan coding agent-mu.
          </p>
        </div>
        <p className="auth-brand-footer">© 2026 Maventlabs</p>
      </aside>
    </main>
  );
}
