"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  async function logout() {
    await Promise.race([
      signOut({ redirect: false }),
      new Promise<void>((resolve) => window.setTimeout(resolve, 20_000)),
    ]);
    window.location.replace("/");
  }

  return (
    <button
      className={iconOnly ? "signout-icon-button" : undefined}
      type="button"
      aria-label={iconOnly ? "Log out" : undefined}
      title={iconOnly ? "Log out" : undefined}
      onClick={() => void logout()}
    >
      {iconOnly ? <LogOut aria-hidden="true" /> : "Log out"}
    </button>
  );
}
