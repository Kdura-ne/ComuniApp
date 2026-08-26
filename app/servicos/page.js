import { getDirectoryEntries } from "@/lib/data";
import DirectoryExplorer from "@/components/directory-explorer";
import PageHero from "@/components/page-hero";
import PublicShell from "@/components/public-shell";

export const metadata = {
  title: "Serviços e ONGs",
  description: "Encontre serviços públicos, atendimento essencial, ONGs e projetos sociais da comunidade.",
};

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const entries = await getDirectoryEntries();

  return (
    <PublicShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Rede de apoio"
          title="Serviços e ONGs perto de você"
          description="Telefones, endereços e horários úteis reunidos em um só lugar para facilitar o acesso da comunidade."
        />
        <DirectoryExplorer entries={Array.isArray(entries) ? entries : []} />
      </div>
    </PublicShell>
  );
}
