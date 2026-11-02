"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, undefined);
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-dark.png" alt="BelzGraphics" className="h-8 w-auto self-start" />
      <div>
        <h1 className="text-2xl font-black">Admin login</h1>
        <p className="text-sm text-muted">Manage designs, categories and orders.</p>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[13px] font-bold text-body">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="min-h-12 rounded-xl border border-field bg-white px-3.5 text-ink outline-none focus:border-brand"
          />
        </label>
        {error && <p role="alert" className="text-sm font-bold text-accent">{error}</p>}
        <button disabled={pending} className="min-h-13 rounded-2xl bg-brand py-3.5 font-extrabold text-white disabled:opacity-60">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
