"use client";

import { useMemo, useState } from "react";
import CommunityMap from "@/components/community-map";
import EmptyState from "@/components/empty-state";
import ReportCard from "@/components/report-card";

const statusOptions = [
  ["all", "Todos os status"],
  ["open", "Abertos"],
  ["in_review", "Em análise"],
  ["resolved", "Resolvidos"],
];

export default function ReportsExplorer({ reports = [], community, showMap = true }) {
  const [kind, setKind] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const seen = new Map();
    for (const report of reports) {
      const categoryId = report.categorySlug || report.categoryId || report.category;
      if (categoryId && !seen.has(categoryId)) {
        seen.set(categoryId, { id: categoryId, label: report.categoryLabel || report.categoryShortLabel || report.category, icon: report.categoryIcon });
      }
    }
    return [...seen.values()].sort((a, b) => String(a.label).localeCompare(String(b.label), "pt-BR"));
  }, [reports]);

  const filteredReports = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return reports.filter((report) => {
      if (kind !== "all" && (report.scope || report.kind) !== kind) return false;
      if (category !== "all" && (report.categorySlug || report.categoryId || report.category) !== category) return false;
      if (status !== "all" && report.status !== status) return false;
      if (!normalizedQuery) return true;
      return [report.title, report.address, report.region, report.categoryLabel, report.categoryShortLabel, report.category, report.protocol]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("pt-BR").includes(normalizedQuery));
    });
  }, [reports, kind, category, status, query]);

  function clearFilters() {
    setKind("all");
    setCategory("all");
    setStatus("all");
    setQuery("");
  }

  if (!reports.length) {
    return (
      <EmptyState
        icon="⌖"
        title="Ainda não há ocorrências no mapa"
        description="Se você encontrou um problema no bairro, registre-o para que a comunidade possa acompanhar."
        actionHref="/denunciar"
        actionLabel="Registrar ocorrência"
      />
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <section aria-label="Filtros de ocorrências" className="min-w-0 max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(15rem,1fr)_auto_auto] lg:items-end">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Buscar</span>
            <span className="relative block">
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">⌕</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rua, protocolo ou problema"
                className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
              />
            </span>
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Tipo</span>
            <select value={kind} onChange={(event) => { setKind(event.target.value); setCategory("all"); }} className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-extrabold text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 lg:w-44">
              <option value="all">Todas</option>
              <option value="civic">Problemas urbanos</option>
              <option value="security">Segurança</option>
            </select>
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Situação</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-extrabold text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 lg:w-44">
              {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        <fieldset className="mt-4 min-w-0 max-w-full border-t border-slate-100 pt-4">
          <legend className="sr-only">Filtrar por categoria</legend>
          <div className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-1">
            <button type="button" onClick={() => setCategory("all")} aria-pressed={category === "all"} className={`min-h-9 shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-black transition ${category === "all" ? "border-brand-700 bg-brand-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700"}`}>Todas</button>
            {categories.filter((item) => kind === "all" || reports.some((report) => (report.categorySlug || report.categoryId || report.category) === item.id && (report.scope || report.kind) === kind)).map((item) => (
              <button key={item.id} type="button" onClick={() => setCategory(item.id)} aria-pressed={category === item.id} className={`min-h-9 shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-black transition ${category === item.id ? "border-brand-700 bg-brand-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700"}`}>
                <span aria-hidden="true">{item.icon || "•"}</span> {item.label}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      {showMap ? <CommunityMap reports={filteredReports} community={community} /> : null}

      <section aria-live="polite" aria-labelledby="lista-ocorrencias">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <h2 id="lista-ocorrencias" className="font-display text-2xl font-black text-slate-950">
              {filteredReports.length} {filteredReports.length === 1 ? "ocorrência" : "ocorrências"}
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">Apoie os relatos que também afetam você.</p>
          </div>
          {(kind !== "all" || category !== "all" || status !== "all" || query) ? (
            <button type="button" onClick={clearFilters} className="min-h-10 rounded-xl px-3 py-2 text-xs font-black text-brand-700 hover:bg-brand-50">Limpar filtros</button>
          ) : null}
        </div>

        {filteredReports.length ? (
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {filteredReports.map((report) => <ReportCard key={report.id} report={report} />)}
          </div>
        ) : (
          <EmptyState icon="⌕" title="Nenhuma ocorrência encontrada" description="Tente remover algum filtro ou buscar por outro endereço." />
        )}
      </section>
    </div>
  );
}
