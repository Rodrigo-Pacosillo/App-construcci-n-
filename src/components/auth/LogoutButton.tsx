"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="section-label text-ink-muted transition-colors hover:text-ink"
    >
      Salir
    </button>
  );
}
