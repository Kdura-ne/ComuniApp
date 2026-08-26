import { z } from "zod";

import {
  DIRECTORY_CATEGORIES,
  DIRECTORY_KINDS,
  REPORT_CATEGORIES,
  SERVICE_COLORS,
  SERVICE_ICONS,
} from "./constants.js";

const categorySlugs = REPORT_CATEGORIES.map((category) => category.slug);

const optionalCoordinate = z
  .preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return null;
      if (typeof value !== "number" && typeof value !== "string") return Number.NaN;
      return Number(value);
    },
    z.number().finite().nullable(),
  )
  .optional()
  .transform((value) => (value === undefined ? null : value));

export const reportInputSchema = z
  .object({
    scope: z.enum(["civic", "security"]).default("civic"),
    category: z.enum(categorySlugs),
    title: z.string().trim().min(5, "Informe um título mais descritivo.").max(160).optional(),
    description: z.string().trim().min(10, "Descreva o problema com pelo menos 10 caracteres.").max(2000),
    address: z.string().trim().min(5, "Informe o endereço ou uma referência.").max(240),
    region: z.string().trim().max(60).default("Centro"),
    latitude: optionalCoordinate,
    longitude: optionalCoordinate,
    // A identidade é usada exclusivamente pela gestão. A denúncia permanece
    // anônima em todas as superfícies públicas, independentemente do valor que
    // um cliente antigo ou adulterado envie neste campo.
    isAnonymous: z.unknown().optional().transform(() => true),
    reporterName: z.string().trim().min(2, "Informe seu nome.").max(120),
    reporterEmail: z.string().trim().email("Informe um e-mail válido.").max(254).transform((value) => value.toLowerCase()),
    image: z
      .object({
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        base64: z.string().min(20).max(1_400_000),
      })
      .nullable()
      .optional(),
  })
  .superRefine((value, context) => {
    const category = REPORT_CATEGORIES.find((item) => item.slug === value.category);
    if (category?.scope !== value.scope && value.category !== "animal" && value.category !== "assalto") {
      context.addIssue({ code: "custom", path: ["category"], message: "Categoria incompatível com o tipo de denúncia." });
    }

    const hasLatitude = Number.isFinite(value.latitude);
    const hasLongitude = Number.isFinite(value.longitude);
    if (!hasLatitude && !hasLongitude) {
      context.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Confirme o local escolhendo uma sugestão ou marcando o ponto no mapa.",
      });
    }
    if (hasLatitude !== hasLongitude) {
      context.addIssue({ code: "custom", path: ["latitude"], message: "As coordenadas devem ser informadas em conjunto." });
    }
    if (hasLatitude && (value.latitude < -90 || value.latitude > 90)) {
      context.addIssue({ code: "custom", path: ["latitude"], message: "Latitude inválida." });
    }
    if (hasLongitude && (value.longitude < -180 || value.longitude > 180)) {
      context.addIssue({ code: "custom", path: ["longitude"], message: "Longitude inválida." });
    }
  });

export const statusUpdateSchema = z.object({
  status: z.enum(["open", "in_review", "resolved", "rejected"]),
  note: z.string().trim().max(500).optional().default(""),
  expectedVersion: z.coerce.number().int().positive().optional(),
});

export const directoryEntrySchema = z
  .object({
    kind: z.enum(DIRECTORY_KINDS),
    category: z.enum(DIRECTORY_CATEGORIES),
    name: z.string().trim().min(3).max(160),
    summary: z.string().trim().max(600).optional().default(""),
    address: z.string().trim().max(240).optional().default(""),
    phone: z.string().trim().max(30).optional().default(""),
    hours: z.string().trim().max(120).optional().default(""),
    icon: z.enum(SERVICE_ICONS).default("🏛️"),
    color: z.enum(SERVICE_COLORS).default("#3a9e72"),
    tags: z.array(z.string().trim().min(1).max(40)).max(8).optional().default([]),
    active: z.boolean().optional().default(true),
    expectedVersion: z.coerce.number().int().positive().optional(),
  })
  .superRefine((value, context) => {
    if (value.kind === "public_service" && value.address.length < 5) {
      context.addIssue({ code: "custom", path: ["address"], message: "Informe o endereço do serviço." });
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  password: z.string().min(8, "Informe a senha.").max(200),
});

export function parseJsonBody(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const first = result.error.issues[0];
    return { ok: false, error: first?.message || "Dados inválidos.", issues: result.error.flatten() };
  }
  return { ok: true, data: result.data };
}
