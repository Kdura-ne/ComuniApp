import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "ComuniApp — seu bairro mais conectado",
    template: "%s | ComuniApp",
  },
  description:
    "Registre problemas urbanos, acompanhe ocorrências e encontre serviços essenciais da sua comunidade.",
  applicationName: "ComuniApp",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ComuniApp — seu bairro mais conectado",
    description:
      "Participe da melhoria do bairro, acompanhe ocorrências e encontre serviços perto de você.",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ComuniApp — Seu bairro. Sua voz.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ComuniApp — seu bairro mais conectado",
    description: "Participe da melhoria do bairro e acompanhe cada ocorrência.",
    images: ["/og.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#267a57",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-stone-50 font-sans text-slate-950 antialiased">
        <a
          href="#conteudo-principal"
          className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-xl transition-transform focus:translate-y-0 focus:outline-none focus:ring-4 focus:ring-emerald-200"
        >
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
