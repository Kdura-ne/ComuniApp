export default function AdminLoading() {
  return (
    <main id="conteudo-principal" className="min-h-dvh bg-[#f5f7f5]">
      <div className="bg-[#1a2e23] px-4 py-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="h-7 w-64 animate-pulse rounded bg-white/15" />
          <div className="mt-3 h-4 w-48 animate-pulse rounded bg-white/10" />
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-xl bg-white/10" />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    </main>
  );
}
