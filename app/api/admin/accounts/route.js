import { z } from "zod";

import {
  createManagerAccount,
  listAdminAccounts,
  requireOwner,
} from "@/lib/auth";

import { apiErrorResponse, noStoreJson, readJson } from "../_shared";

export const dynamic = "force-dynamic";

const managerSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  password: z
    .string()
    .min(12, "A senha temporária deve ter pelo menos 12 caracteres.")
    .max(200),
});

export async function GET() {
  try {
    await requireOwner();
    return noStoreJson({ accounts: await listAdminAccounts() });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const owner = await requireOwner();
    const input = managerSchema.parse(await readJson(request));
    const account = await createManagerAccount(input, owner);

    return noStoreJson({ ok: true, account }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
