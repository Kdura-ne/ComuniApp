"use client";

export default function EmergencyTrigger({ className = "" }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("comuniapp:emergency"))}
      className={className || "inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-red-700 shadow-lg hover:bg-red-50"}
      aria-haspopup="dialog"
    >
      <span aria-hidden="true">🆘</span>&nbsp; Ver contatos de emergência
    </button>
  );
}
