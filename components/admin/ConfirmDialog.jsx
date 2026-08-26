"use client";

import AdminModal from "./AdminModal";

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  busyLabel = "Arquivando…",
  busy = false,
  onCancel,
  onConfirm,
}) {
  return (
    <AdminModal
      title={title}
      description={description}
      onClose={busy ? () => {} : onCancel}
      size="small"
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </AdminModal>
  );
}
