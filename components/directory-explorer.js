"use client";

import { useMemo, useState } from "react";
import EmptyState from "@/components/empty-state";

const toneByColor = {
  "#dc2626": "bg-red-50 text-red-700 ring-red-100",
  "#1d4ed8": "bg-blue-50 text-blue-700 ring-blue-100",
  "#f97316": "bg-orange-50 text-orange-700 ring-orange-100",
  "#7c3aed": "bg-violet-50 text-violet-700 ring-violet-100",
  "#3a9e72": "bg-brand-50 text-brand-700 ring-brand-100",
  "#eab308": "bg-amber-50 text-amber-700 ring-amber-100",
};

function DirectoryCard({ entry }) {
  const tone = toneByColor[String(entry.color || "").toLowerCase()] || "bg-slate-50 text-slate-700 ring-slate-100";
  const phone = String(entry.phone || "").replace(/\D/g, "");

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft motion-reduce:transform-none sm:p-5">
      <div className="flex items-start gap-3.5">
        <span aria-hidden="true" className={`grid size-12 shrink-0 place-items-center rounded-2xl text-2xl ring-1 ${tone}`}>{entry.icon || (entry.kind === "ngo" ? "🌱" : "🏛️")}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 font-display text-lg font-black leading-tight text-slate-950">{entry.name}</h3>
            {entry.type ? <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${tone}`}>{entry.type}</span> : null}
          </div>
          {entry.description ? <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{entry.description}</p> : null}
          <dl className="mt-3 space-y-1.5 text-xs font-semibold text-slate-500">
            {entry.address ? <div className="flex gap-2"><dt className="sr-only">Endereço</dt><span aria-hidden="true">📍</span><dd>{entry.address}</dd></div> : null}
            {entry.hours ? <div className="flex gap-2"><dt className="sr-only">Horário</dt><span aria-hidden="true">◷</span><dd>{entry.hours}</dd></div> : null}
          </dl>
          {Array.isArray(entry.tags) && entry.tags.length ? (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Características">
              {entry.tags.map((tag) => <li key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold text-slate-600">{tag}</li>)}
            </ul>
          ) : null}
        </div>
      </div>
      {(phone || entry.address) ? (
        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
          {phone ? <a href={`tel:${phone}`} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-brand-700 px-3 py-2 text-xs font-black text-white hover:bg-brand-800">📞 {entry.phone}</a> : null}
          {entry.address ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entry.address)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">Ver no mapa <span className="sr-only">(abre em nova aba)</span></a> : null}
        </div>
      ) : null}
    </article>
  );
}

export default function DirectoryExplorer({ entries = [] }) {
  const [tab, setTab] = useState("public_service");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");

  const tabEntries = useMemo(() => entries.filter((entry) => entry.kind === tab), [entries, tab]);
  const categories = useMemo(() => [...new Set(tabEntries.map((entry) => entry.type).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")), [tabEntries]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return tabEntries.filter((entry) => {
      if (category !== "all" && entry.type !== category) return false;
      if (!needle) return true;
      return [entry.name, entry.type, entry.description, entry.address, ...(entry.tags || [])].filter(Boolean).some((value) => String(value).toLocaleLowerCase("pt-BR").includes(needle));
    });
  }, [tabEntries, category, query]);

  function changeTab(nextTab) {
    setTab(nextTab);
    setCategory("all");
    setQuery("");
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
      <div role="tablist" aria-label="Tipos de serviço" className="grid grid-cols-2 border-b border-slate-200">
        <button id="servicos-publicos-tab" type="button" role="tab" aria-selected={tab === "public_service"} aria-controls="diretorio-panel" onClick={() => changeTab("public_service")} className={`min-h-14 border-b-4 px-3 py-3 text-xs font-black sm:text-sm ${tab === "public_service" ? "border-brand-600 bg-brand-50/60 text-brand-800" : "border-transparent text-slate-500 hover:bg-slate-50"}`}>🏛️ Serviços públicos</button>
        <button id="ongs-tab" type="button" role="tab" aria-selected={tab === "ngo"} aria-controls="diretorio-panel" onClick={() => changeTab("ngo")} className={`min-h-14 border-b-4 px-3 py-3 text-xs font-black sm:text-sm ${tab === "ngo" ? "border-brand-600 bg-brand-50/60 text-brand-800" : "border-transparent text-slate-500 hover:bg-slate-50"}`}>🌱 ONGs e projetos</button>
      </div>

      <div id="diretorio-panel" role="tabpanel" aria-labelledby={tab === "ngo" ? "ongs-tab" : "servicos-publicos-tab"} className="p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(14rem,1fr)_auto] md:items-end">
          <label>
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Buscar por nome, serviço ou endereço</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === "ngo" ? "Ex.: esporte, música, famílias" : "Ex.: UBS, escola, saúde"} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100" />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Categoria</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-extrabold text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 md:w-48">
              <option value="all">Todas</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>

        <div className="my-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <p className="text-sm font-black text-slate-800">{filtered.length} {filtered.length === 1 ? "local encontrado" : "locais encontrados"}</p>
          {(query || category !== "all") ? <button type="button" onClick={() => { setQuery(""); setCategory("all"); }} className="min-h-9 rounded-lg px-2 text-xs font-black text-brand-700 hover:bg-brand-50">Limpar filtros</button> : null}
        </div>

        {filtered.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((entry) => <DirectoryCard key={entry.id} entry={entry} />)}
          </div>
        ) : (
          <EmptyState icon={tab === "ngo" ? "🌱" : "🏛️"} title="Nenhum local encontrado" description="Tente buscar por outro termo ou remova o filtro de categoria." />
        )}
      </div>
    </section>
  );
}
