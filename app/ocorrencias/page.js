import Link from "next/link";
import { getReports } from "@/lib/data";
import PageHero from "@/components/page-hero";
import PublicShell from "@/components/public-shell";
import ReportsExplorer from "@/components/reports-explorer";

export const metadata = {
  title: "Ocorrências",
  description: "Consulte e acompanhe os relatos registrados pela comunidade.",
};

export const dynamic = "force-dynamic";

export default async function OccurrencesPage() {
  const result = await getReports({ limit: 100 });

  return (
    <PublicShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Acompanhamento público"
          title="Ocorrências da comunidade"
          description="Busque por rua, protocolo ou categoria e acompanhe o andamento de cada registro."
          action={<Link href="/denunciar" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-brand-800 shadow-lg hover:bg-brand-50">＋ Nova denúncia</Link>}
        />
        <ReportsExplorer reports={Array.isArray(result) ? result : result?.items || []} showMap={false} />
      </div>
    </PublicShell>
  );
}
