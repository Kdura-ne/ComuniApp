import PageHero from "@/components/page-hero";
import PublicShell from "@/components/public-shell";
import ReportForm from "@/components/report-form";

export const metadata = {
  title: "Registrar denúncia",
  description: "Registre um problema urbano para que a comunidade e a gestão possam acompanhar.",
};

export const dynamic = "force-dynamic";

export default async function ReportPage({ searchParams }) {
  const query = await searchParams;
  const latitude = typeof query?.lat === "string" ? query.lat : "";
  const longitude = typeof query?.lng === "string" ? query.lng : "";
  const address = typeof query?.endereco === "string" ? query.endereco : "";

  return (
    <PublicShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Participação cidadã"
          title="Registrar denúncia"
          description="Leva poucos minutos. Informe o local com clareza para ajudar a gestão a encontrar e resolver o problema."
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-white/80">
            <span>✓ Protocolo de acompanhamento</span>
            <span>✓ Anonimato público garantido</span>
            <span>✓ Foto opcional</span>
          </div>
        </PageHero>
        <ReportForm initialAddress={address} initialLatitude={latitude} initialLongitude={longitude} />
      </div>
    </PublicShell>
  );
}
