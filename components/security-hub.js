"use client";

import { useState } from "react";
import EmptyState from "@/components/empty-state";
import ReportCard from "@/components/report-card";
import ReportForm from "@/components/report-form";

export default function SecurityHub({ reports = [] }) {
  const [tab, setTab] = useState("history");

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
      <div className="grid grid-cols-2 border-b border-slate-200" role="tablist" aria-label="Segurança da comunidade">
        <button id="historico-tab" type="button" role="tab" aria-selected={tab === "history"} aria-controls="historico-panel" onClick={() => setTab("history")} className={`min-h-14 border-b-4 px-4 py-3 text-sm font-black transition ${tab === "history" ? "border-brand-600 bg-brand-50/60 text-brand-800" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-brand-700"}`}>📋 Histórico</button>
        <button id="denunciar-seguranca-tab" type="button" role="tab" aria-selected={tab === "report"} aria-controls="denunciar-seguranca-panel" onClick={() => setTab("report")} className={`min-h-14 border-b-4 px-4 py-3 text-sm font-black transition ${tab === "report" ? "border-brand-600 bg-brand-50/60 text-brand-800" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-brand-700"}`}>🔔 Denunciar</button>
      </div>

      {tab === "history" ? (
        <div id="historico-panel" role="tabpanel" aria-labelledby="historico-tab" className="p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">Relatos recentes</p>
            <h2 className="mt-1 font-display text-2xl font-black text-slate-950">Segurança no bairro</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Informações públicas sem identificação do denunciante.</p>
          </div>
          {reports.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {reports.map((report) => <ReportCard key={report.id} report={report} compact />)}
            </div>
          ) : (
            <EmptyState icon="◇" title="Nenhuma ocorrência de segurança recente" description="Use a aba “Denunciar” para registrar uma situação que precisa de atenção, com o máximo de contexto possível." />
          )}
        </div>
      ) : (
        <div id="denunciar-seguranca-panel" role="tabpanel" aria-labelledby="denunciar-seguranca-tab" className="bg-slate-50/60 p-3 sm:p-5">
          <ReportForm mode="security" compact />
        </div>
      )}
    </section>
  );
}
