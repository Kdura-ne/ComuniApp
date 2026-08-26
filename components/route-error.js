"use client";

import Link from "next/link";

export default function RouteError({ reset }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-stone-50 px-4 py-12">
      <main id="conteudo-principal" className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-soft sm:p-10">
        <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-2xl">!</span>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-red-700">Algo não saiu como esperado</p>
        <h1 className="mt-2 font-display text-3xl font-black text-slate-950">Não foi possível carregar esta página</h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-500">A conexão pode estar instável. Tente novamente; seus dados não foram alterados.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="min-h-12 rounded-xl bg-brand-700 px-5 py-3 text-sm font-black text-white hover:bg-brand-800">Tentar novamente</button>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">Voltar ao início</Link>
        </div>
      </main>
    </div>
  );
}
