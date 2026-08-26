"use client";

import { useState } from "react";

export default function VoteButton({ reportId, initialVotes = 0, initialVoted = false, compact = false }) {
  const [votes, setVotes] = useState(Number(initialVotes) || 0);
  const [voted, setVoted] = useState(Boolean(initialVoted));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function toggleVote() {
    if (pending) return;
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/reports/${encodeURIComponent(reportId)}/vote`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Não foi possível registrar seu apoio.");
      setVoted(Boolean(payload.voted));
      setVotes(Number(payload.votes) || 0);
    } catch (requestError) {
      setError(requestError.message || "Não foi possível registrar seu apoio.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={toggleVote}
        disabled={pending}
        aria-pressed={voted}
        aria-label={`${voted ? "Retirar apoio" : "Apoiar ocorrência"}. ${votes} ${votes === 1 ? "apoio" : "apoios"}`}
        className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border font-black transition disabled:cursor-wait disabled:opacity-60 ${
          compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
        } ${
          voted
            ? "border-brand-300 bg-brand-50 text-brand-800"
            : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700"
        }`}
      >
        <span aria-hidden="true">{pending ? "…" : voted ? "♥" : "♡"}</span>
        <span>{votes}</span>
        {!compact ? <span>{votes === 1 ? "apoio" : "apoios"}</span> : null}
      </button>
      {error ? <p role="status" className="mt-1 max-w-48 text-[10px] font-bold leading-tight text-red-700">{error}</p> : null}
    </div>
  );
}
