"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import ConfirmDialog from "./ConfirmDialog";
import AdminAccountPanel from "./AdminAccountPanel";
import DirectoryFormDialog from "./DirectoryFormDialog";
import ReportDetailDialog from "./ReportDetailDialog";

const STATUS = {
  open: {
    label: "Aberto",
    badge: "border-red-200 bg-red-50 text-red-700",
    border: "border-red-300",
  },
  in_review: {
    label: "Em análise",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    border: "border-amber-300",
  },
  resolved: {
    label: "Resolvido",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    border: "border-emerald-300",
  },
  rejected: {
    label: "Rejeitado",
    badge: "border-slate-300 bg-slate-100 text-slate-600",
    border: "border-slate-300",
  },
};

const REPORT_FILTERS = [
  ["all", "Todas"],
  ["open", "Abertas"],
  ["in_review", "Em análise"],
  ["resolved", "Resolvidas"],
  ["rejected", "Rejeitadas"],
];

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function reportStats(reports) {
  return {
    total: reports.length,
    open: reports.filter((report) => report.status === "open").length,
    inReview: reports.filter((report) => report.status === "in_review").length,
    resolved: reports.filter((report) => report.status === "resolved").length,
    rejected: reports.filter((report) => report.status === "rejected").length,
  };
}

function normalizedText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error || "Não foi possível concluir a operação.");
    error.status = response.status;
    error.issues = payload.issues;
    throw error;
  }

  return payload;
}

export default function AdminDashboard({
  initialDashboard,
  initialAdmin,
  initialAccounts,
}) {
  const router = useRouter();
  const [admin, setAdmin] = useState(initialAdmin);
  const [reports, setReports] = useState(initialDashboard?.reports || []);
  const [directoryEntries, setDirectoryEntries] = useState(
    initialDashboard?.directoryEntries || [],
  );
  const [section, setSection] = useState(
    initialAdmin.mustChangePassword ? "account" : "reports",
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [reportSearch, setReportSearch] = useState("");
  const [directoryKind, setDirectoryKind] = useState("public_service");
  const [directorySearch, setDirectorySearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetail, setReportDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);
  const [directoryForm, setDirectoryForm] = useState(null);
  const [directoryBusy, setDirectoryBusy] = useState(false);
  const [directoryError, setDirectoryError] = useState("");
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => reportStats(reports), [reports]);

  const filteredReports = useMemo(() => {
    const search = normalizedText(reportSearch.trim());

    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) return false;
      if (kindFilter !== "all" && (report.scope || report.kind) !== kindFilter) return false;
      if (!search) return true;

      return normalizedText(
        [
          report.protocol,
          report.title,
          report.categoryLabel,
          report.category,
          report.address,
          report.region,
        ].join(" "),
      ).includes(search);
    });
  }, [kindFilter, reportSearch, reports, statusFilter]);

  const filteredDirectory = useMemo(() => {
    const search = normalizedText(directorySearch.trim());

    return directoryEntries.filter((entry) => {
      if (entry.kind !== directoryKind) return false;
      if (!search) return true;

      return normalizedText(
        [entry.name, entry.type, entry.description, entry.address, ...(entry.tags || [])].join(" "),
      ).includes(search);
    });
  }, [directoryEntries, directoryKind, directorySearch]);

  const handleUnauthorized = useCallback((error) => {
    if (error?.status === 401) {
      router.replace("/admin/login");
      router.refresh();
      return true;
    }

    return false;
  }, [router]);

  async function refreshDashboard() {
    setRefreshing(true);
    setGlobalError("");

    try {
      const result = await readResponse(
        await fetch("/api/admin/dashboard", { cache: "no-store" }),
      );
      setReports(result.reports || []);
      setDirectoryEntries(result.directoryEntries || []);
    } catch (error) {
      if (!handleUnauthorized(error)) {
        setGlobalError(error.message);
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function loadReportDetail(reportId) {
    setDetailLoading(true);
    setDetailError("");

    try {
      const result = await readResponse(
        await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}`, {
          cache: "no-store",
        }),
      );
      setReportDetail(result.report);
    } catch (error) {
      if (!handleUnauthorized(error)) {
        setDetailError(error.message);
      }
    } finally {
      setDetailLoading(false);
    }
  }

  function openReport(report) {
    setSelectedReport(report);
    setReportDetail(null);
    void loadReportDetail(report.id);
  }

  async function changeReportStatus(status, note) {
    const current = reportDetail || selectedReport;
    if (!current) return;

    setStatusBusy(true);
    setDetailError("");

    try {
      const result = await readResponse(
        await fetch(`/api/admin/reports/${encodeURIComponent(current.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            note,
            expectedVersion: current.version,
          }),
        }),
      );

      setReports((items) =>
        items.map((item) => (item.id === result.report.id ? result.report : item)),
      );
      setSelectedReport(result.report);
      setReportDetail(result.report);
      await loadReportDetail(result.report.id);
    } catch (error) {
      if (!handleUnauthorized(error)) {
        setDetailError(
          error.status === 409
            ? "A denúncia foi atualizada por outra sessão. Recarregue os detalhes antes de tentar novamente."
            : error.message,
        );
      }
    } finally {
      setStatusBusy(false);
    }
  }

  function openNewDirectoryEntry() {
    setDirectoryError("");
    setDirectoryForm({ mode: "create", entry: null, kind: directoryKind });
  }

  function openEditDirectoryEntry(entry) {
    setDirectoryError("");
    setDirectoryForm({ mode: "edit", entry, kind: entry.kind });
  }

  async function saveDirectoryEntry(input) {
    const editing = directoryForm?.mode === "edit";
    const entry = directoryForm?.entry;
    const url = editing
      ? `/api/admin/directory/${encodeURIComponent(entry.id)}`
      : "/api/admin/directory";

    setDirectoryBusy(true);
    setDirectoryError("");

    try {
      const result = await readResponse(
        await fetch(url, {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
      );

      setDirectoryEntries((items) => {
        const next = editing
          ? items.map((item) => (item.id === result.entry.id ? result.entry : item))
          : [...items, result.entry];

        return next.sort(
          (left, right) =>
            (left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
            left.name.localeCompare(right.name, "pt-BR"),
        );
      });
      setDirectoryKind(result.entry.kind);
      setDirectoryForm(null);
    } catch (error) {
      if (!handleUnauthorized(error)) {
        setDirectoryError(
          error.status === 409
            ? "Este cadastro foi alterado por outra sessão. Atualize o painel e tente novamente."
            : error.message,
        );
      }
    } finally {
      setDirectoryBusy(false);
    }
  }

  async function archiveDirectoryEntry() {
    if (!archiveTarget) return;

    setArchiveBusy(true);
    setGlobalError("");

    try {
      await readResponse(
        await fetch(`/api/admin/directory/${encodeURIComponent(archiveTarget.id)}`, {
          method: "DELETE",
        }),
      );
      setDirectoryEntries((items) =>
        items.filter((item) => item.id !== archiveTarget.id),
      );
      setArchiveTarget(null);
    } catch (error) {
      if (!handleUnauthorized(error)) {
        setGlobalError(error.message);
      }
    } finally {
      setArchiveBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main id="conteudo-principal" className="min-h-dvh bg-[#f5f7f5] pb-10 text-[#1a2e23]">
      <header className="bg-[#1a2e23] text-white shadow-lg">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <a href="/" className="text-xs font-bold text-white/60 hover:text-white">
                ← Voltar ao aplicativo
              </a>
              <h1 className="mt-2 font-display text-2xl font-black">Painel Administrativo</h1>
              <p className="mt-1 text-sm text-white/60">Gestão de denúncias, serviços e ONGs</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden text-right sm:block">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">Sessão</p>
                <p className="max-w-48 truncate text-xs font-semibold text-white/75">{admin.email}</p>
              </div>
              <button
                type="button"
                onClick={refreshDashboard}
                disabled={refreshing}
                className="rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-60"
              >
                {refreshing ? "Atualizando…" : "↻ Atualizar"}
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold transition hover:bg-white/20"
              >
                Sair
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ["Total", stats.total, "text-white"],
              ["Abertas", stats.open, "text-red-300"],
              ["Em análise", stats.inReview, "text-amber-300"],
              ["Resolvidas", stats.resolved, "text-emerald-300"],
              ["Rejeitadas", stats.rejected, "text-slate-300"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-xl bg-white/10 px-3 py-3 text-center">
                <p className={`font-display text-2xl font-black ${color}`}>{value}</p>
                <p className="mt-0.5 text-[10px] font-bold text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <nav className="mx-auto flex max-w-6xl" aria-label="Seções do painel">
          {[
            ["reports", "📋 Denúncias"],
            ["directory", "🏛️ Serviços e ONGs"],
            ["account", "🔐 Conta e acessos"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSection(value)}
              aria-current={section === value ? "page" : undefined}
              className={`flex-1 border-b-[3px] px-4 py-3 text-sm font-extrabold transition ${
                section === value
                  ? "border-[#3a9e72] text-[#287a59]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5">
        {admin.mustChangePassword && section !== "account" ? (
          <button
            type="button"
            onClick={() => setSection("account")}
            className="mb-4 w-full rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-left text-sm font-extrabold text-amber-900 transition hover:bg-amber-100"
          >
            Seu acesso ainda usa a senha temporária. Toque aqui para trocá-la.
          </button>
        ) : null}

        {globalError ? (
          <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            <p>{globalError}</p>
            <button type="button" onClick={() => setGlobalError("")} className="font-black" aria-label="Fechar aviso">
              ×
            </button>
          </div>
        ) : null}

        {section === "reports" ? (
          <section aria-labelledby="reports-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="reports-title" className="font-display text-xl font-black text-slate-950">
                  Denúncias recebidas
                </h2>
                <p className="mt-1 text-sm text-slate-500">{filteredReports.length} resultado(s)</p>
              </div>
              <label className="w-full sm:w-72">
                <span className="sr-only">Buscar denúncias</span>
                <input
                  type="search"
                  value={reportSearch}
                  onChange={(event) => setReportSearch(event.target.value)}
                  placeholder="Buscar protocolo, título ou local…"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3a9e72]"
                />
              </label>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {REPORT_FILTERS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={statusFilter === value}
                  onClick={() => setStatusFilter(value)}
                  className={`shrink-0 rounded-full border-2 px-3.5 py-1.5 text-xs font-extrabold transition ${
                    statusFilter === value
                      ? "border-[#1a2e23] bg-[#1a2e23] text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              {[
                ["all", "Todas as áreas"],
                ["civic", "🏘️ Urbano"],
                ["security", "🔒 Segurança"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={kindFilter === value}
                  onClick={() => setKindFilter(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ${
                    kindFilter === value
                      ? "bg-[#e8f7f0] text-[#287a59]"
                      : "text-slate-400 hover:bg-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {filteredReports.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {filteredReports.map((report) => {
                  const status = STATUS[report.status] || {
                    label: report.statusLabel || report.status,
                    badge: "border-slate-200 bg-slate-50 text-slate-600",
                    border: "border-slate-200",
                  };

                  return (
                    <article key={report.id} className={`rounded-2xl border-2 bg-white p-4 shadow-sm ${status.border}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-[11px] font-black tracking-wide text-slate-400">
                            {report.protocol}
                          </p>
                          <h3 className="mt-1 font-bold leading-5 text-slate-950">{report.title}</h3>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${status.badge}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
                        <span>{report.categoryIcon} {report.categoryLabel || report.category}</span>
                        <span>📍 {report.region || report.address || "Sem região"}</span>
                        <span>📅 {formatDate(report.createdAt)}</span>
                        <span>👍 {report.votes ?? 0}</span>
                        {report.hasImage || report.imageUrl || report.mediaId ? <span>📷 Foto</span> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => openReport(report)}
                        className="mt-3 w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-600 transition hover:border-[#3a9e72] hover:text-[#287a59]"
                      >
                        Ver detalhes e histórico
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-10 text-center">
                <p className="text-3xl" aria-hidden="true">🔎</p>
                <p className="mt-2 font-bold text-slate-600">Nenhuma denúncia encontrada.</p>
                <p className="mt-1 text-sm text-slate-400">Altere os filtros ou a busca.</p>
              </div>
            )}
          </section>
        ) : section === "directory" ? (
          <section aria-labelledby="directory-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="directory-title" className="font-display text-xl font-black text-slate-950">
                  Diretório comunitário
                </h2>
                <p className="mt-1 text-sm text-slate-500">Cadastros ativos exibidos aos moradores</p>
              </div>
              <button
                type="button"
                onClick={openNewDirectoryEntry}
                className="rounded-full bg-[#3a9e72] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#2f855f]"
              >
                + Adicionar
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr]">
              <div className="flex rounded-xl border-2 border-slate-200 bg-white p-1">
                {[
                  ["public_service", "🏛️ Serviços"],
                  ["ngo", "🌱 ONGs"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={directoryKind === value}
                    onClick={() => setDirectoryKind(value)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                      directoryKind === value
                        ? "bg-[#1a2e23] text-white"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label>
                <span className="sr-only">Buscar no diretório</span>
                <input
                  type="search"
                  value={directorySearch}
                  onChange={(event) => setDirectorySearch(event.target.value)}
                  placeholder="Buscar nome, categoria ou endereço…"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3a9e72]"
                />
              </label>
            </div>

            {filteredDirectory.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {filteredDirectory.map((entry) => (
                  <article key={entry.id} className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl" aria-hidden="true">{entry.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold leading-5 text-slate-950">{entry.name}</h3>
                          <span className="shrink-0 rounded-full bg-[#e8f7f0] px-2.5 py-1 text-[10px] font-extrabold text-[#287a59]">
                            {entry.type}
                          </span>
                        </div>
                        {entry.description ? <p className="mt-2 text-xs leading-5 text-slate-500">{entry.description}</p> : null}
                        <div className="mt-2 space-y-1 text-[11px] font-semibold text-slate-500">
                          {entry.address ? <p>📍 {entry.address}</p> : null}
                          {entry.phone ? <p>📞 {entry.phone}</p> : null}
                          {entry.hours ? <p>🕐 {entry.hours}</p> : null}
                        </div>
                        {entry.tags?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {entry.tags.map((tag) => (
                              <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => openEditDirectoryEntry(entry)}
                        className="rounded-xl border-2 border-slate-200 px-3 py-2 text-xs font-extrabold text-slate-600 hover:border-[#3a9e72] hover:text-[#287a59]"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setArchiveTarget(entry)}
                        className="rounded-xl border-2 border-red-100 px-3 py-2 text-xs font-extrabold text-red-600 hover:border-red-300 hover:bg-red-50"
                      >
                        🗃️ Arquivar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-10 text-center">
                <p className="text-3xl" aria-hidden="true">🏛️</p>
                <p className="mt-2 font-bold text-slate-600">Nenhum cadastro encontrado.</p>
                <button type="button" onClick={openNewDirectoryEntry} className="mt-2 text-sm font-extrabold text-[#287a59] hover:underline">
                  Criar o primeiro cadastro
                </button>
              </div>
            )}
          </section>
        ) : (
          <AdminAccountPanel
            admin={admin}
            initialAccounts={initialAccounts}
            onAdminUpdated={setAdmin}
            onUnauthorized={handleUnauthorized}
          />
        )}
      </div>

      {selectedReport ? (
        <ReportDetailDialog
          report={selectedReport}
          detail={reportDetail}
          loading={detailLoading}
          error={detailError}
          busy={statusBusy}
          onClose={() => {
            setSelectedReport(null);
            setReportDetail(null);
            setDetailError("");
          }}
          onRetry={() => loadReportDetail(selectedReport.id)}
          onChangeStatus={changeReportStatus}
        />
      ) : null}

      {directoryForm ? (
        <DirectoryFormDialog
          entry={directoryForm.entry}
          defaultKind={directoryForm.kind}
          busy={directoryBusy}
          error={directoryError}
          onCancel={() => setDirectoryForm(null)}
          onSubmit={saveDirectoryEntry}
        />
      ) : null}

      {archiveTarget ? (
        <ConfirmDialog
          title="Arquivar cadastro?"
          description={`“${archiveTarget.name}” deixará de aparecer para os moradores. O registro continuará preservado no histórico.`}
          confirmLabel="Arquivar"
          busy={archiveBusy}
          onCancel={() => setArchiveTarget(null)}
          onConfirm={archiveDirectoryEntry}
        />
      ) : null}
    </main>
  );
}
