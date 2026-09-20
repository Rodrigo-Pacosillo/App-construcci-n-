"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="section-label text-ink/50 transition-colors hover:text-ink"
    >
      Salir
    </button>
  );
}
