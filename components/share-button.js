"use client";

import { useState } from "react";

export default function ShareButton({ title }) {
  const [message, setMessage] = useState("");

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
        setMessage("Compartilhado.");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setMessage("Link copiado.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") setMessage("Não foi possível compartilhar.");
    }
  }

  return (
    <div>
      <button type="button" onClick={share} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50">
        ↗ Compartilhar
      </button>
      {message ? <p role="status" className="mt-1 text-[10px] font-bold text-slate-500">{message}</p> : null}
    </div>
  );
}
