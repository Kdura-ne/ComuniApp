import Link from "next/link";

export default function EmptyState({ icon = "⌕", title, description, actionHref, actionLabel }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center shadow-card">
      <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-2xl text-brand-700">
        {icon}
      </span>
      <h2 className="mt-4 font-display text-lg font-black text-slate-950">{title}</h2>
      {description ? <p className="mx-auto mt-1.5 max-w-md text-sm font-semibold leading-relaxed text-slate-500">{description}</p> : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-black text-white shadow-sm hover:bg-brand-700">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
