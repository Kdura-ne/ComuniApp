import Link from "next/link";
import { getHomeData, getReportByProtocol } from "@/lib/data";
import { getStatusMeta } from "@/lib/constants";
import CommunityMap from "@/components/community-map";
import PublicShell from "@/components/public-shell";
import ShareButton from "@/components/share-button";
import StatusBadge from "@/components/status-badge";
import VoteButton from "@/components/vote-button";
import { getCoordinatePair } from "@/lib/coordinates";

export const dynamic = "force-dynamic";

function formatDate(value, withTime = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export async function generateMetadata({ params }) {
  const { protocol } = await params;
  const report = await getReportByProtocol(protocol).catch(() => null);
  if (!report) return { title: "Ocorrência não encontrada" };
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const image = report.hasImage && report.imageUrl
    ? new URL(report.imageUrl, baseUrl).toString()
    : null;
  const title = report.title || report.protocol;
  const description = `${report.categoryLabel || report.category}: ${report.address}. Acompanhe o andamento no ComuniApp.`;
  return {
    title,
    description,
    openGraph: { title, description, images: image ? [image] : [] },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] },
  };
}

export default async function OccurrenceDetailPage({ params }) {
  const { protocol } = await params;
  const [report, homeData] = await Promise.all([
    getReportByProtocol(protocol),
    getHomeData(),
  ]);

  if (!report) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft sm:p-12">
          <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-2xl">⌕</span>
          <h1 className="mt-5 font-display text-3xl font-black text-slate-950">Ocorrência não encontrada</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Confira o protocolo ou volte para consultar todos os registros públicos.</p>
          <Link href="/ocorrencias" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-700 px-5 py-3 text-sm font-black text-white hover:bg-brand-800">Ver ocorrências</Link>
        </div>
      </PublicShell>
    );
  }

  const history = Array.isArray(report.history) ? report.history : [];
  const hasCoordinates = Boolean(getCoordinatePair(report.latitude, report.longitude));

  return (
    <PublicShell>
      <article className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <Link href="/ocorrencias" className="inline-flex min-h-10 items-center rounded-xl px-2 py-2 text-xs font-black text-brand-700 hover:bg-brand-50">← Todas as ocorrências</Link>
          <ShareButton title={report.title || report.protocol} />
        </div>

        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
          <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 px-5 py-7 text-white sm:px-8 sm:py-9">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ring-1 ring-white/15">{report.protocol}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black ring-1 ring-white/15">{report.categoryIcon} {report.categoryLabel || report.category}</span>
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-3xl font-black leading-tight tracking-tight sm:text-4xl">{report.title || report.categoryLabel || report.category}</h1>
            <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-white/75"><span aria-hidden="true">📍</span>{report.address}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={report.status} label={report.statusLabel} />
              {report.isAnonymous ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">Relato anônimo</span> : null}
              {report.createdAt ? <time dateTime={report.createdAt} className="text-xs font-semibold text-slate-500">Registrado em {formatDate(report.createdAt)}</time> : null}
            </div>
            <VoteButton reportId={report.id} initialVotes={report.votes} initialVoted={report.hasVoted} />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            {report.hasImage && report.imageUrl ? (
              <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
                <img src={report.imageUrl} alt={`Foto anexada à ocorrência ${report.protocol}`} className="max-h-[36rem] w-full object-cover" />
                <figcaption className="border-t border-slate-100 px-4 py-3 text-xs font-semibold text-slate-500">Foto enviada junto ao relato pela comunidade.</figcaption>
              </figure>
            ) : null}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-7" aria-labelledby="descricao-ocorrencia">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">Relato</p>
              <h2 id="descricao-ocorrencia" className="mt-1 font-display text-2xl font-black text-slate-950">Descrição da ocorrência</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">{report.description || "Nenhuma descrição pública foi informada."}</p>
              <dl className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
                {report.region ? <div><dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Região</dt><dd className="mt-1 text-sm font-extrabold text-slate-800">{report.region}</dd></div> : null}
                {report.updatedAt ? <div><dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Última atualização</dt><dd className="mt-1 text-sm font-extrabold text-slate-800">{formatDate(report.updatedAt, true)}</dd></div> : null}
                {report.resolvedAt ? <div><dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Resolvido em</dt><dd className="mt-1 text-sm font-extrabold text-slate-800">{formatDate(report.resolvedAt, true)}</dd></div> : null}
              </dl>
            </section>

            {hasCoordinates ? (
              <section aria-labelledby="local-ocorrencia">
                <h2 id="local-ocorrencia" className="mb-3 px-1 font-display text-2xl font-black text-slate-950">Local no mapa</h2>
                <CommunityMap reports={[report]} community={homeData?.community || {}} compact />
              </section>
            ) : null}
          </div>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-6" aria-labelledby="historico-status">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">Transparência</p>
            <h2 id="historico-status" className="mt-1 font-display text-xl font-black text-slate-950">Histórico de status</h2>
            {history.length ? (
              <ol className="mt-5 space-y-0">
                {history.map((event, index) => (
                  <li key={`${event.createdAt}-${index}`} className="relative flex gap-3 pb-6 last:pb-0">
                    {index < history.length - 1 ? <span aria-hidden="true" className="absolute left-[0.4375rem] top-4 h-full w-px bg-brand-200" /> : null}
                    <span aria-hidden="true" className="relative mt-1.5 size-3.5 shrink-0 rounded-full border-4 border-brand-100 bg-brand-700" />
                    <div>
                      <p className="text-sm font-black text-slate-900">{event.statusLabel || getStatusMeta(event.toStatus).label}</p>
                      {event.note ? <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">{event.note}</p> : null}
                      {event.createdAt ? <time dateTime={event.createdAt} className="mt-1.5 block text-[10px] font-bold text-slate-400">{formatDate(event.createdAt, true)}</time> : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-xs font-semibold leading-relaxed text-slate-500">O primeiro andamento aparecerá aqui assim que a gestão atualizar o relato.</p>
            )}
          </aside>
        </div>
      </article>
    </PublicShell>
  );
}
