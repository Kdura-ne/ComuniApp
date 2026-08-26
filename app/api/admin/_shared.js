import { z } from "zod";

import {
  isAuthConfigurationError,
  isAuthenticationError,
  isAuthorizationError,
} from "@/lib/auth";
import {
  DIRECTORY_CATEGORIES,
  SERVICE_COLORS,
  SERVICE_ICONS,
} from "@/lib/constants";

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

export const reportStatusSchema = z
  .object({
    status: z.enum(["open", "in_review", "resolved", "rejected"]),
    note: optionalText(500),
    expectedVersion: z.coerce.number().int().positive(),
  })
  .superRefine((value, context) => {
    if (value.status === "resolved" && (!value.note || value.note.length < 3)) {
      context.addIssue({ code: "custom", path: ["note"], message: "Descreva a solução aplicada." });
    }
  });

const directoryFields = {
  kind: z.enum(["public_service", "ngo"]),
  name: z.string().trim().min(2).max(160),
  type: z.enum(DIRECTORY_CATEGORIES),
  description: optionalText(600),
  address: optionalText(240),
  phone: optionalText(30),
  hours: optionalText(120),
  icon: z.enum(SERVICE_ICONS),
  color: z.enum(SERVICE_COLORS),
  tags: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000).optional(),
};

export const createDirectorySchema = z
  .object(directoryFields)
  .superRefine((value, context) => {
    if (value.kind === "public_service" && !value.address) {
      context.addIssue({
        code: "custom",
        path: ["address"],
        message: "Endereço é obrigatório para serviço público.",
      });
    }
  });

export const updateDirectorySchema = z
  .object({
    ...directoryFields,
    expectedVersion: z.coerce.number().int().positive(),
  })
  .superRefine((value, context) => {
    if (value.kind === "public_service" && !value.address) {
      context.addIssue({
        code: "custom",
        path: ["address"],
        message: "Endereço é obrigatório para serviço público.",
      });
    }
  });

export function noStoreJson(body, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");

  return Response.json(body, { ...init, headers });
}

export function apiErrorResponse(error) {
  if (error instanceof z.ZodError) {
    return noStoreJson(
      { error: "Revise os campos enviados.", issues: error.issues },
      { status: 422 },
    );
  }

  if (isAuthenticationError(error)) {
    return noStoreJson({ error: error.message }, { status: 401 });
  }

  if (isAuthorizationError(error)) {
    return noStoreJson({ error: error.message }, { status: 403 });
  }

  if (isAuthConfigurationError(error)) {
    return noStoreJson(
      { error: "A autenticação administrativa não está configurada." },
      { status: 503 },
    );
  }

  if (error?.code === "23505") {
    return noStoreJson(
      { error: "Já existe um cadastro com estes dados." },
      { status: 409 },
    );
  }

  const status = Number.isInteger(error?.status) ? error.status : 500;

  if (status >= 400 && status < 500) {
    return noStoreJson(
      { error: error.message || "Não foi possível concluir a operação." },
      { status },
    );
  }

  console.error("Falha na API administrativa", error);
  return noStoreJson(
    { error: "Não foi possível concluir a operação agora." },
    { status: 500 },
  );
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    const error = new Error("O corpo da requisição deve ser JSON válido.");
    error.status = 400;
    throw error;
  }
}
