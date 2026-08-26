export const COMMUNITY = {
  id: "00000000-0000-4000-8000-000000000001",
  name: process.env.NEXT_PUBLIC_COMMUNITY_NAME || "Bairro Mutirão | Jardim São Bento | SP",
  latitude: Number(process.env.NEXT_PUBLIC_COMMUNITY_LAT || -23.67),
  longitude: Number(process.env.NEXT_PUBLIC_COMMUNITY_LNG || -46.75),
};

export const REPORT_CATEGORIES = [
  { slug: "buraco", label: "Buraco na rua", shortLabel: "Buraco", icon: "🚧", scope: "civic" },
  { slug: "iluminacao", label: "Falta de iluminação", shortLabel: "Iluminação", icon: "💡", scope: "civic" },
  { slug: "poste", label: "Poste quebrado", shortLabel: "Poste", icon: "🔌", scope: "civic" },
  { slug: "lixo", label: "Lixo acumulado", shortLabel: "Lixo", icon: "🗑️", scope: "civic" },
  { slug: "enchente", label: "Enchente", shortLabel: "Enchente", icon: "🌊", scope: "civic" },
  { slug: "transito", label: "Trânsito perigoso", shortLabel: "Trânsito", icon: "🚦", scope: "civic" },
  { slug: "parque", label: "Parque danificado", shortLabel: "Parque", icon: "🌳", scope: "civic" },
  { slug: "calcada", label: "Calçada quebrada", shortLabel: "Calçada", icon: "🧱", scope: "civic" },
  { slug: "assalto", label: "Assalto / Roubo", shortLabel: "Assalto", icon: "🚨", scope: "security" },
  { slug: "tentativa-roubo", label: "Tentativa de roubo", shortLabel: "Tentativa de roubo", icon: "🔪", scope: "security" },
  { slug: "area-perigosa", label: "Área perigosa", shortLabel: "Área perigosa", icon: "⚠️", scope: "security" },
  { slug: "animal", label: "Maus-tratos animais", shortLabel: "Maus-tratos", icon: "🐾", scope: "security" },
];

export const STATUS_META = {
  open: {
    label: "Aberto",
    border: "border-red-500",
    text: "text-red-700",
    background: "bg-red-50",
    marker: "#dc2626",
  },
  in_review: {
    label: "Em análise",
    border: "border-amber-400",
    text: "text-amber-700",
    background: "bg-amber-50",
    marker: "#eab308",
  },
  resolved: {
    label: "Resolvido",
    border: "border-emerald-500",
    text: "text-emerald-700",
    background: "bg-emerald-50",
    marker: "#3a9e72",
  },
  rejected: {
    label: "Arquivado",
    border: "border-slate-400",
    text: "text-slate-600",
    background: "bg-slate-50",
    marker: "#64748b",
  },
};

export const DIRECTORY_KINDS = ["public_service", "ngo"];
export const DIRECTORY_CATEGORIES = ["Saúde", "Segurança", "Educação", "Social", "Assistência", "Serviços", "Cultura", "Esportes"];

export const SERVICE_COLORS = ["#dc2626", "#1d4ed8", "#f97316", "#7c3aed", "#3a9e72", "#eab308"];
export const SERVICE_ICONS = ["🏥", "👮", "🏫", "🤝", "🚑", "📮", "🏛️", "🚒", "🌳", "⛪", "📚", "⚽", "🎸", "🤲"];

export function getCategory(slug) {
  return REPORT_CATEGORIES.find((category) => category.slug === slug);
}

export function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.open;
}
