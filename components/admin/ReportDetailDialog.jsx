"use client";

import { useEffect, useState } from "react";

import AdminModal from "./AdminModal";

const STATUS = {
  open: {
    label: "Aberto",
    badge: "border-red-200 bg-red-50 text-red-700",
  },
  in_review: {
    label: "Em análise",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
  },
  resolved: {
    label: "Resolvido",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  rejected: {
    label: "Rejeitado",
    badge: "border-slate-300 bg-slate-100 text-slate-600",
  },
};

const PRIORITY = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const NEXT_STATUS = {
  open: "in_review",
  in_review: "resolved",
};

function formatDateTime(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatBytes(value) {
  if (!Number.isFinite(value)) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReportDetailDialog({
  report: summary,
  detail,
  loading,
  error,
  busy,
  onClose,
  onRetry,
  onChangeStatus,
}) {
  const [note, setNote] = useState("");
  const report = detail || summary;
  const nextStatus = NEXT_STATUS[report?.status];
  const canReopen = ["resolved", "rejected"].includes(report?.status);
  const targetStatus = nextStatus || (canReopen ? "open" : null);
  const requiresNote = canReopen || targetStatus === "resolved";

  useEffect(() => {
    setNote("");
  }, [report?.id, report?.status]);

  if (!report) return null;

  const status = STATUS[report.status] || {
    label: report.statusLabel || report.status,
    badge: "border-slate-200 bg-slate-50 text-slate-600",
  };
  const media = detail?.media?.length
    ? detail.media
    : detail?.imageUrl
      ? [
          {
            id: `${detail.id}-image`,
            mimeType: "image/*",
            fileName: "Foto da denúncia",
            url: detail.imageUrl,
          },
        ]
      : [];
  const history = detail?.statusHistory || detail?.history || [];

  return (
    <AdminModal
      title={report.protocol || "Detalhes da denúncia"}
      description="Dados completos, evidências e histórico de atendimento."
      onClose={busy ? () => {} : onClose}
    >
      <div className="space-y-5 p-4">
        {loading ? (
          <div className="space-y-3" aria-label="Carregando detalhes">
            <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-bold">{error}</p>
            <button type="button" onClick={onRetry} className="mt-2 font-extrabold underline">
              Tentar novamente
            </button>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <section className="rounded-2xl border-2 border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${status.badge}`}>
                  {status.label}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                  {(report.scope || report.kind) === "security" ? "🔒 Segurança" : "🏘️ Urbano"}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                  Prioridade {PRIORITY[report.priority] || report.priority || "—"}
                </span>
              </div>

              <h3 className="mt-3 font-display text-lg font-black text-slate-950">
                {report.categoryIcon ? `${report.categoryIcon} ` : ""}
                {report.title}
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {report.description || "Sem descrição complementar."}
              </p>

              <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-extrabold uppercase text-slate-400">Local</dt>
                  <dd className="mt-1 font-semibold text-slate-700">📍 {report.address || "Não informado"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-extrabold uppercase text-slate-400">Região</dt>
                  <dd className="mt-1 font-semibold text-slate-700">{report.region || "Não informada"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-extrabold uppercase text-slate-400">Categoria</dt>
                  <dd className="mt-1 font-semibold text-slate-700">{report.categoryLabel || report.category || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-extrabold uppercase text-slate-400">Registro</dt>
                  <dd className="mt-1 font-semibold text-slate-700">{formatDateTime(report.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-extrabold uppercase text-slate-400">Apoios</dt>
                  <dd className="mt-1 font-semibold text-slate-700">👍 {report.votes ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-extrabold uppercase text-slate-400">Visibilidade pública</dt>
                  <dd className="mt-1 font-semibold text-slate-700">
                    Anônima
                  </dd>
                </div>
                {report.reporterName || report.reporterEmail ? (
                  <div className="sm:col-span-2 rounded-xl bg-brand-50 p-3">
                    <dt className="text-[11px] font-extrabold uppercase text-brand-700">Identificação privada · somente administradores</dt>
                    <dd className="mt-1 font-semibold text-slate-700">
                      {report.reporterName || "Nome não informado"}
                      {report.reporterEmail ? <a href={`mailto:${report.reporterEmail}`} className="ml-2 text-brand-700 hover:underline">{report.reporterEmail}</a> : null}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {report.latitude != null && report.longitude != null ? (
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(`${report.latitude},${report.longitude}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-xs font-extrabold text-[#287a59] hover:underline"
                >
                  Abrir coordenadas no mapa ↗
                </a>
              ) : null}
            </section>

            <section>
              <h3 className="font-display text-base font-black text-slate-950">Foto e anexos</h3>
              {media.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {media.map((mediaItem) => (
                    <a
                      key={mediaItem.id}
                      href={mediaItem.url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-50 transition hover:border-[#3a9e72]"
                    >
                      {mediaItem.mimeType?.startsWith("image/") ? (
                        <img
                          src={mediaItem.url}
                          alt={mediaItem.fileName ? `Anexo ${mediaItem.fileName}` : "Foto enviada na denúncia"}
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <div className="grid aspect-video place-items-center text-4xl" aria-hidden="true">
                          📎
                        </div>
                      )}
                      <div className="px-3 py-2 text-xs">
                        <p className="truncate font-bold text-slate-700">{mediaItem.fileName || "Anexo"}</p>
                        <p className="mt-0.5 text-slate-400">{formatBytes(mediaItem.byteSize)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-xl border border-dashed border-slate-300 px-3 py-5 text-center text-sm text-slate-400">
                  Nenhuma foto anexada.
                </p>
              )}
            </section>

            <section>
              <h3 className="font-display text-base font-black text-slate-950">Histórico de status</h3>
              {history.length ? (
                <ol className="mt-3 space-y-3 border-l-2 border-slate-200 pl-4">
                  {history.map((item, index) => (
                    <li key={item.id || `${item.toStatus}-${item.createdAt}-${index}`} className="relative rounded-xl bg-slate-50 p-3 text-sm">
                      <span className="absolute -left-[22px] top-4 h-3 w-3 rounded-full border-2 border-white bg-[#3a9e72] ring-2 ring-slate-200" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-extrabold text-slate-700">
                          {item.fromStatus ? `${STATUS[item.fromStatus]?.label || item.fromStatus} → ` : ""}
                          {item.statusLabel || STATUS[item.toStatus]?.label || item.toStatus}
                        </p>
                        <time className="text-[11px] font-semibold text-slate-400">
                          {formatDateTime(item.createdAt)}
                        </time>
                      </div>
                      {item.note ? <p className="mt-1 whitespace-pre-wrap text-slate-600">{item.note}</p> : null}
                      <p className="mt-1 text-[11px] text-slate-400">Por {item.changedBy || "sistema"}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Ainda não há alterações registradas.</p>
              )}
            </section>

            {targetStatus ? (
              <section className="rounded-2xl bg-[#f0faf5] p-4">
                <label htmlFor="status-note" className="text-xs font-extrabold uppercase text-[#287a59]">
                  Observação {requiresNote ? "*" : "(opcional)"}
                </label>
                <textarea
                  id="status-note"
                  rows={3}
                  maxLength={2000}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-2 w-full resize-y rounded-xl border-2 border-emerald-100 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-[#3a9e72]"
                  placeholder={canReopen ? "Explique por que a denúncia será reaberta." : targetStatus === "resolved" ? "Descreva a solução aplicada." : "Registre informações úteis para o histórico."}
                />
                <button
                  type="button"
                  disabled={busy || (requiresNote && note.trim().length < 3)}
                  onClick={() => onChangeStatus(targetStatus, note.trim() || undefined)}
                  className="mt-3 w-full rounded-xl bg-[#3a9e72] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#2f855f] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {busy
                    ? "Atualizando…"
                    : canReopen
                      ? "Reabrir denúncia"
                      : `Avançar para ${STATUS[targetStatus].label}`}
                </button>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </AdminModal>
  );
}
