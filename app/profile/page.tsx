import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import BrandLogo from "@/components/brand-logo";
import PageMotion from "@/components/page-motion";
import SignOutButton from "@/components/sign-out-button";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Manage your AnyMD account profile.",
};

function initials(name: string | null | undefined, email: string): string {
  const source = name?.trim() || email;
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profile");

  const user = session.user;

  return (
    <PageMotion className="page-motion-root profile-motion-root">
    <main className="profile-page">
      <header className="profile-header" data-gsap="reveal">
        <Link href="/" aria-label="AnyMD home">
          <BrandLogo className="wordmark-image" />
        </Link>
        <nav aria-label="Profile navigation">
          <Link href="/">Back to AnyMD</Link>
          <SignOutButton />
        </nav>
      </header>

      <section className="profile-shell" aria-labelledby="profile-title" data-gsap="group">
        <span className="section-kicker">AnyMD / Profile</span>
        <h1 id="profile-title" data-gsap-item>Your account.</h1>
        <p className="profile-intro" data-gsap-item>
          Your account keeps your generation quota and workspace access connected.
        </p>

        <div className="profile-card" data-gsap="reveal">
          <div className="profile-identity">
            <span className="profile-avatar" aria-hidden="true">
              {initials(user.name, user.email ?? "")}
            </span>
            <div>
              <h2>{user.name || "AnyMD member"}</h2>
              <p>{user.email || "Authenticated AnyMD account"}</p>
            </div>
          </div>
          <dl className="profile-details">
            <div>
              <dt>Sign-in</dt>
              <dd>Authenticated session</dd>
            </div>
            <div>
              <dt>Account ID</dt>
              <dd>{user.id}</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
    </PageMotion>
  );
}
