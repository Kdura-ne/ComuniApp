"use client";

import { useEffect, useId, useRef } from "react";

const fallbackContacts = [
  { id: "samu", label: "SAMU", number: "192", icon: "🚑", description: "Emergência médica", color: "#dc2626" },
  { id: "bombeiros", label: "Bombeiros", number: "193", icon: "🚒", description: "Incêndios e resgates", color: "#f97316" },
  { id: "policia", label: "Polícia Militar", number: "190", icon: "👮", description: "Ocorrências policiais", color: "#1d4ed8" },
  { id: "defesa-civil", label: "Defesa Civil", number: "199", icon: "🏚️", description: "Desastres naturais", color: "#7c3aed" },
  { id: "cvv", label: "CVV", number: "188", icon: "💙", description: "Apoio emocional 24h", color: "#0891b2" },
];

const toneByColor = {
  "#dc2626": "border-red-200 bg-red-50/60 text-red-700",
  "#f97316": "border-orange-200 bg-orange-50/60 text-orange-700",
  "#1d4ed8": "border-blue-200 bg-blue-50/60 text-blue-700",
  "#7c3aed": "border-violet-200 bg-violet-50/60 text-violet-700",
  "#0891b2": "border-cyan-200 bg-cyan-50/60 text-cyan-700",
};

export default function EmergencyModal({ contacts, onClose }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const items = contacts?.length ? contacts : fallbackContacts;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-red-600 px-5 py-5 text-white sm:rounded-t-3xl">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-3xl">🆘</span>
            <div>
              <h2 id={titleId} className="font-display text-xl font-black">Emergência</h2>
              <p id={descriptionId} className="mt-0.5 text-sm font-semibold text-white/80">
                Selecione o serviço de ajuda imediata.
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-xl font-bold hover:bg-white/25"
            aria-label="Fechar contatos de emergência"
          >
            ×
          </button>
        </header>

        <div className="space-y-3 p-4 sm:p-5">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-bold leading-relaxed text-amber-900">
            Em situação de risco imediato, ligue diretamente para o serviço adequado. Uma denúncia no aplicativo não substitui uma chamada de emergência.
          </p>

          <ul className="space-y-2.5" aria-label="Telefones de emergência">
            {items.map((contact) => {
              const tone = toneByColor[String(contact.color).toLowerCase()] || "border-slate-200 bg-slate-50 text-slate-800";
              const number = String(contact.number || "").replace(/\D/g, "");
              return (
                <li key={contact.id || `${contact.label}-${contact.number}`}>
                  <a
                    href={`tel:${number}`}
                    className={`group flex min-h-20 items-center gap-3 rounded-2xl border-2 px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none ${tone}`}
                    aria-label={`Ligar para ${contact.label}, telefone ${contact.number}`}
                  >
                    <span aria-hidden="true" className="text-2xl">{contact.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-slate-950">{contact.label}</span>
                      <span className="block text-xs font-semibold text-slate-500">{contact.description}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-display text-2xl font-black">{contact.number}</span>
                      <span className="block text-[10px] font-black uppercase tracking-wide">Ligar agora</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-200"
          >
            Fechar
          </button>
        </div>
      </section>
    </div>
  );
}
