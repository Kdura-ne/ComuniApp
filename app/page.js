import Link from "next/link";
import { getHomeData } from "@/lib/data";
import CommunityMap from "@/components/community-map";
import EmptyState from "@/components/empty-state";
import PublicShell from "@/components/public-shell";
import ReportCard from "@/components/report-card";

export const metadata = {
  title: "Início",
  description: "Acompanhe o bairro, registre problemas e encontre serviços públicos perto de você.",
};

export const dynamic = "force-dynamic";

const statsConfig = [
  { key: "resolvedToday", label: "Resolvidos hoje", icon: "✓" },
  { key: "resolvedMonth", label: "Resolvidos no mês", icon: "↗" },
  { key: "reportsToday", label: "Denúncias hoje", icon: "+" },
];

export default async function HomePage() {
  const data = await getHomeData();
  const community = data?.community || {};
  const stats = data?.stats || {};
  const recentReports = Array.isArray(data?.recentReports) ? data.recentReports : [];
  const place = [community.neighborhood, community.city, community.state].filter(Boolean).join(" · ") || community.name;

  return (
    <PublicShell>
      <div className="space-y-6 sm:space-y-8">
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 px-5 py-8 text-white shadow-soft sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div aria-hidden="true" className="absolute -right-16 -top-20 size-72 rounded-full border-[52px] border-white/5" />
          <div aria-hidden="true" className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-white/5 blur-2xl" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold text-white/90 ring-1 ring-white/15">
                <span aria-hidden="true">📍</span>
                {place || "Mutirão · Jardim São Bento · SP"}
              </p>
              <p className="text-sm font-extrabold text-brand-100">Bem-vindo, morador!</p>
              <h1 className="mt-2 max-w-2xl font-display text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                Seu bairro melhora com a sua participação.
              </h1>
              <p className="mt-4 max-w-xl text-sm font-semibold leading-relaxed text-white/75 sm:text-base">
                Registre problemas urbanos, acompanhe cada andamento e encontre apoio perto de você.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/denunciar" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-brand-800 shadow-lg shadow-brand-950/20 transition hover:-translate-y-0.5 hover:bg-brand-50 motion-reduce:transform-none">
                  <span aria-hidden="true">＋</span> Registrar denúncia
                </Link>
                <Link href="/mapa" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20">
                  <span aria-hidden="true">⌖</span> Explorar o mapa
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[25rem]">
              {statsConfig.map((item) => (
                <div key={item.key} className="rounded-2xl bg-white/10 px-2 py-3 text-center ring-1 ring-white/15 backdrop-blur-sm sm:px-4 sm:py-4">
                  <span aria-hidden="true" className="mx-auto mb-1 grid size-6 place-items-center rounded-lg bg-white/10 text-xs font-black">{item.icon}</span>
                  <p className="font-display text-2xl font-black tabular-nums sm:text-3xl">{Number(stats[item.key]) || 0}</p>
                  <p className="mt-1 text-[9px] font-extrabold leading-tight text-white/70 sm:text-[11px]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="mapa-do-bairro" className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
          <div>
            <div className="mb-3 flex items-end justify-between gap-3 px-1">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">Visão da comunidade</p>
                <h2 id="mapa-do-bairro" className="mt-1 font-display text-2xl font-black text-slate-950">O que está acontecendo por perto</h2>
              </div>
              <Link href="/mapa" className="hidden rounded-lg px-2 py-1 text-xs font-black text-brand-700 hover:bg-brand-50 sm:block">Abrir mapa →</Link>
            </div>
            <CommunityMap reports={recentReports} community={community} compact />
          </div>

          <aside className="rounded-3xl border border-brand-100 bg-brand-50 p-5 shadow-card sm:p-6" aria-labelledby="participar-titulo">
            <span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">🤝</span>
            <h2 id="participar-titulo" className="mt-4 font-display text-2xl font-black text-brand-950">Participar é simples</h2>
            <ol className="mt-5 space-y-4">
              {[
                ["1", "Conte o que aconteceu", "Escolha a categoria e descreva o local."],
                ["2", "A comunidade acompanha", "Moradores podem apoiar a prioridade."],
                ["3", "A gestão atualiza", "O histórico mostra cada mudança de status."],
              ].map(([number, title, text]) => (
                <li key={number} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-700 text-xs font-black text-white">{number}</span>
                  <div>
                    <p className="text-sm font-black text-brand-950">{title}</p>
                    <p className="mt-0.5 text-xs font-semibold leading-relaxed text-brand-900/65">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/denunciar" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-800">
              Fazer uma denúncia
            </Link>
          </aside>
        </section>

        <section aria-labelledby="recentes-titulo">
          <div className="mb-4 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">Transparência</p>
              <h2 id="recentes-titulo" className="mt-1 font-display text-2xl font-black text-slate-950">Problemas recentes</h2>
            </div>
            <Link href="/ocorrencias" className="rounded-lg px-2 py-1 text-xs font-black text-brand-700 hover:bg-brand-50">Ver todos →</Link>
          </div>
          {recentReports.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {recentReports.slice(0, 4).map((report) => <ReportCard key={report.id} report={report} />)}
            </div>
          ) : (
            <EmptyState
              icon="✓"
              title="Nenhuma ocorrência recente"
              description="Quando um morador registrar um problema, ele aparecerá aqui para acompanhamento da comunidade."
              actionHref="/denunciar"
              actionLabel="Registrar a primeira"
            />
          )}
        </section>
      </div>
    </PublicShell>
  );
}
