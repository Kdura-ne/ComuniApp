const protocolPattern = /^D\d{4}-\d{3,8}$/;

export function isValidProtocol(protocol) {
  return protocolPattern.test(String(protocol || "").toUpperCase());
}

export function normalizeProtocol(protocol) {
  return String(protocol || "").trim().replace(/^#/, "").toUpperCase();
}

export function formatDate(value, options = {}) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
    year: options.withYear === false ? undefined : "numeric",
    ...options,
  }).format(new Date(value));
}

export function relativeDate(value, now = new Date()) {
  const target = new Date(value);
  const diffMs = now.getTime() - target.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ontem";
  if (days < 7) return `Há ${days} dias`;
  return formatDate(value);
}

export function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}
