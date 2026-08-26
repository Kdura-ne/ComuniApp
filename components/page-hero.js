export default function PageHero({ eyebrow, title, description, action, children, tone = "brand" }) {
  const toneClass =
    tone === "dark"
      ? "from-slate-950 via-slate-900 to-brand-950"
      : tone === "danger"
        ? "from-red-700 via-red-600 to-orange-600"
        : "from-brand-800 via-brand-700 to-brand-500";

  return (
    <section className={`relative isolate overflow-hidden rounded-3xl bg-gradient-to-br px-5 py-7 text-white shadow-soft sm:px-8 sm:py-9 lg:px-10 ${toneClass}`}>
      <div aria-hidden="true" className="absolute -right-16 -top-20 size-64 rounded-full border-[42px] border-white/5" />
      <div aria-hidden="true" className="absolute -bottom-28 left-1/3 size-56 rounded-full bg-white/5 blur-2xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/70">{eyebrow}</p>
          ) : null}
          <h1 className="font-display text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-white/80 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div className="relative mt-6">{children}</div> : null}
    </section>
  );
}
