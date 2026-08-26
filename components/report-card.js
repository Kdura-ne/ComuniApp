import Link from "next/link";
import StatusBadge from "@/components/status-badge";
import VoteButton from "@/components/vote-button";

const priorityBorder = {
  urgent: "border-l-red-600",
  high: "border-l-red-500",
  medium: "border-l-amber-400",
  low: "border-l-brand-500",
};

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export default function ReportCard({ report, compact = false }) {
  const href = report.protocol ? `/ocorrencias/${encodeURIComponent(report.protocol)}` : "/ocorrencias";
  const dateLabel = formatDate(report.createdAt);
  const categoryLabel = report.categoryLabel || report.categoryShortLabel || report.category;

  return (
    <article className={`group min-w-0 max-w-full rounded-2xl border border-l-4 border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft motion-reduce:transform-none ${priorityBorder[report.priority] || "border-l-brand-500"}`}>
      <div className={compact ? "min-w-0 p-4" : "min-w-0 p-4 sm:p-5"}>
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-2xl ring-1 ring-slate-100">
            {report.categoryIcon || ((report.scope || report.kind) === "security" ? "⚠️" : "📍")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {report.protocol ? <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{report.protocol}</p> : null}
                <h3 className="font-display text-base font-black leading-snug text-slate-950 sm:text-lg">
                  <Link href={href} className="rounded-sm decoration-brand-300 decoration-2 underline-offset-4 hover:underline">
                    {report.title || categoryLabel || "Ocorrência comunitária"}
                  </Link>
                </h3>
              </div>
              <StatusBadge status={report.status} label={report.statusLabel} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
              {categoryLabel ? <span>{categoryLabel}</span> : null}
              {report.address ? <span className="truncate">📍 {report.address}</span> : null}
              {!report.address && report.region ? <span>📍 {report.region}</span> : null}
              {dateLabel ? <time dateTime={report.createdAt}>{dateLabel}</time> : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <VoteButton
            reportId={report.id}
            initialVotes={report.votes}
            initialVoted={report.hasVoted}
            compact={compact}
          />
          <Link href={href} className="rounded-lg px-2 py-1.5 text-xs font-black text-brand-700 hover:bg-brand-50 hover:text-brand-900">
            Ver detalhes <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
