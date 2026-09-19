"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  async function logout() {
    await signOut({ callbackUrl: "/" });
  }

  return (
    <button type="button" onClick={() => void logout()}>
      Log out
    </button>
  );
}
