"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível entrar.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (submitError) {
      setError(submitError.message || "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="conteudo-principal" className="mx-auto flex min-h-dvh w-full max-w-[430px] items-center bg-[#f5f7f5] px-4 py-10">
      <section className="w-full overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
        <header className="bg-[#1a2e23] px-5 py-6 text-white">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-4xl">
              🏠
            </span>
            <div>
              <p className="font-display text-2xl font-black">ComuniApp</p>
              <p className="mt-1 text-sm text-white/65">Acesso administrativo</p>
            </div>
          </div>
        </header>

        <form className="space-y-4 p-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500"
            >
              E-mail
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-3 text-sm text-slate-950 outline-none transition focus:border-[#3a9e72] focus:ring-4 focus:ring-[#3a9e72]/10"
              placeholder="admin@exemplo.com"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500"
            >
              Senha
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-3 text-sm text-slate-950 outline-none transition focus:border-[#3a9e72] focus:ring-4 focus:ring-[#3a9e72]/10"
              placeholder="Sua senha administrativa"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#3a9e72] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#2f855f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3a9e72] disabled:cursor-wait disabled:bg-slate-300"
          >
            {busy ? "Entrando…" : "Entrar no painel"}
          </button>

          <a
            href="/"
            className="block text-center text-sm font-bold text-slate-500 hover:text-[#3a9e72]"
          >
            ← Voltar ao aplicativo
          </a>
        </form>
      </section>
    </main>
  );
}
