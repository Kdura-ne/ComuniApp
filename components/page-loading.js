export default function PageLoading() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <div className="h-16 border-b border-brand-800/10 bg-brand-700">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <div className="size-10 animate-pulse rounded-2xl bg-white/15 motion-reduce:animate-none" />
          <div className="h-6 w-32 animate-pulse rounded-lg bg-white/15 motion-reduce:animate-none" />
        </div>
      </div>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8" aria-busy="true" aria-label="Carregando conteúdo">
        <div className="h-64 animate-pulse rounded-3xl bg-brand-100 motion-reduce:animate-none" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />)}
        </div>
        <p className="sr-only">Carregando…</p>
      </main>
    </div>
  );
}
