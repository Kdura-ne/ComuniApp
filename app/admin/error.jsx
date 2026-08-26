"use client";

export default function AdminError({ reset }) {
  return (
    <main id="conteudo-principal" className="grid min-h-dvh place-items-center bg-[#f5f7f5] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-lg">
        <span className="text-5xl" aria-hidden="true">⚠️</span>
        <h1 className="mt-3 font-display text-xl font-black text-slate-950">
          Painel indisponível
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Não foi possível carregar os dados administrativos. Confira a conexão com o banco e tente novamente.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 w-full rounded-xl bg-[#3a9e72] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#2f855f]"
        >
          Tentar novamente
        </button>
        <a href="/" className="mt-3 block text-sm font-bold text-slate-500 hover:text-[#287a59]">
          ← Voltar ao aplicativo
        </a>
      </section>
    </main>
  );
}
