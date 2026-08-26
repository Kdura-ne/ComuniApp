const statusClasses = {
  open: "border-red-200 bg-red-50 text-red-700",
  in_review: "border-amber-200 bg-amber-50 text-amber-800",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-slate-200 bg-slate-100 text-slate-600",
};

const fallbackLabels = {
  open: "Aberto",
  in_review: "Em análise",
  resolved: "Resolvido",
  rejected: "Arquivado",
};

export default function StatusBadge({ status, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClasses[status] || statusClasses.rejected}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label || fallbackLabels[status] || "Status indisponível"}
    </span>
  );
}
