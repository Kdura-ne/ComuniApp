import { z } from "zod";

import {
  requireAdmin,
  setAdminSession,
  updateOwnAdminAccount,
} from "@/lib/auth";

import { apiErrorResponse, noStoreJson, readJson } from "../_shared";

export const dynamic = "force-dynamic";

const accountSchema = z
  .object({
    email: z.string().trim().email("Informe um e-mail válido.").max(254),
    currentPassword: z.string().min(1, "Informe a senha atual.").max(200),
    newPassword: z
      .string()
      .max(200)
      .optional()
      .transform((value) => value?.trim() || undefined),
  })
  .superRefine((value, context) => {
    if (value.newPassword && value.newPassword.length < 12) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "A nova senha deve ter pelo menos 12 caracteres.",
      });
    }
  });

export async function PATCH(request) {
  try {
    const admin = await requireAdmin({ allowTemporaryPassword: true });
    const input = accountSchema.parse(await readJson(request));
    const updated = await updateOwnAdminAccount(admin, input);

    await setAdminSession(updated);

    return noStoreJson({ ok: true, admin: updated });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
