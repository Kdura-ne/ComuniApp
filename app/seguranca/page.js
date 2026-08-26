import { getReports } from "@/lib/data";
import EmergencyTrigger from "@/components/emergency-trigger";
import PageHero from "@/components/page-hero";
import PublicShell from "@/components/public-shell";
import SecurityHub from "@/components/security-hub";

export const metadata = {
  title: "Segurança da comunidade",
  description: "Consulte alertas comunitários, faça um relato de segurança e acesse telefones de emergência.",
};

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const result = await getReports({ scope: "security", limit: 50 });

  return (
    <PublicShell>
      <div className="space-y-6">
        <PageHero
          tone="danger"
          eyebrow="Cuidado coletivo"
          title="Segurança da comunidade"
          description="Registre situações de risco e acompanhe alertas recentes. Em perigo imediato, use um canal oficial de emergência."
          action={<EmergencyTrigger />}
        />
        <SecurityHub reports={Array.isArray(result) ? result : result?.items || []} />
      </div>
    </PublicShell>
  );
}
