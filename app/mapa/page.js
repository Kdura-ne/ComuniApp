import Link from "next/link";
import { getHomeData, getReports } from "@/lib/data";
import PageHero from "@/components/page-hero";
import PublicShell from "@/components/public-shell";
import ReportsExplorer from "@/components/reports-explorer";

export const metadata = {
  title: "Mapa de ocorrências",
  description: "Explore no mapa os problemas urbanos e alertas registrados pela comunidade.",
};

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const [reportsResult, homeData] = await Promise.all([
    getReports({ limit: 100 }),
    getHomeData(),
  ]);

  return (
    <PublicShell>
      <div className="space-y-6">
        <PageHero
          eyebrow={homeData?.community?.name || "Mapa comunitário"}
          title="Veja onde o bairro precisa de atenção"
          description="Filtre os registros, confira a situação de cada ponto e apoie as ocorrências que também afetam você."
          action={
            <Link href="/denunciar" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-brand-800 shadow-lg hover:bg-brand-50">
              ＋ Registrar problema
            </Link>
          }
        />
        <ReportsExplorer reports={Array.isArray(reportsResult) ? reportsResult : reportsResult?.items || []} community={homeData?.community || {}} />
      </div>
    </PublicShell>
  );
}
