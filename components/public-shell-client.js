"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import EmergencyModal from "@/components/emergency-modal";

const navigation = [
  { href: "/", label: "Início", icon: "⌂" },
  { href: "/mapa", label: "Mapa", icon: "⌖" },
  { href: "/denunciar", label: "Denunciar", icon: "+" },
  { href: "/seguranca", label: "Segurança", icon: "◇" },
  { href: "/servicos", label: "Serviços", icon: "✦" },
];

function isCurrent(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PublicShellClient({ children, emergencyContacts }) {
  const pathname = usePathname();
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    const openEmergency = () => setShowEmergency(true);
    window.addEventListener("comuniapp:emergency", openEmergency);
    return () => window.removeEventListener("comuniapp:emergency", openEmergency);
  }, []);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-brand-800/15 bg-brand-700/95 text-white shadow-sm backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5 rounded-xl py-1.5 focus-visible:outline-white"
            aria-label="ComuniApp — ir para o início"
          >
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl shadow-inner ring-1 ring-white/20 transition-transform group-hover:-rotate-3"
            >
              🏠
            </span>
            <span className="truncate font-display text-xl font-black tracking-tight sm:text-2xl">
              ComuniApp
            </span>
          </Link>

          <nav
            aria-label="Navegação principal"
            className="ml-auto hidden items-center gap-1 lg:flex"
          >
            {navigation.map((item) => {
              const active = isCurrent(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-3 py-2 text-sm font-extrabold transition-colors ${
                    active
                      ? "bg-white text-brand-800"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-3">
            <Link
              href="/admin"
              aria-label="Abrir área da gestão"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/20 px-2.5 py-2 text-xs font-extrabold text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
            >
              <span className="sm:hidden">Gestão</span>
              <span className="hidden sm:inline">Área da gestão</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowEmergency(true)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white shadow-lg shadow-red-950/20 transition hover:bg-red-700 active:scale-[0.98] sm:px-4 sm:text-sm"
              aria-haspopup="dialog"
            >
              <span aria-hidden="true">SOS</span>
              <span className="hidden sm:inline">Emergência</span>
            </button>
          </div>
        </div>
      </header>

      <main id="conteudo-principal" className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-12">
        {children}
      </main>

      <footer className="hidden border-t border-slate-200 bg-white/70 py-5 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 text-xs font-semibold text-slate-500">
          <p>ComuniApp · participação que melhora o bairro.</p>
          <Link href="/ocorrencias" className="text-brand-700 hover:text-brand-900 hover:underline">
            Ver todas as ocorrências
          </Link>
        </div>
      </footer>

      <nav
        aria-label="Navegação principal móvel"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_-24px_rgba(15,23,42,0.5)] backdrop-blur-lg lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 px-1 pt-1.5">
          {navigation.map((item) => {
            const active = isCurrent(pathname, item.href);
            const highlighted = item.href === "/denunciar";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-extrabold transition-colors sm:text-xs ${
                  active ? "text-brand-700" : "text-slate-500 hover:bg-slate-50 hover:text-brand-700"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-7 place-items-center rounded-lg text-lg leading-none ${
                    highlighted
                      ? "bg-brand-600 font-black text-white shadow-md shadow-brand-900/20"
                      : active
                        ? "bg-brand-50"
                        : ""
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {showEmergency ? (
        <EmergencyModal
          contacts={emergencyContacts}
          onClose={() => setShowEmergency(false)}
        />
      ) : null}
    </div>
  );
}
