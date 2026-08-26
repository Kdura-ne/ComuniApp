import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  deactivateManagerAccount,
  requireOwner,
} from "@/lib/auth";

import { apiErrorResponse, noStoreJson } from "../../_shared";

export const dynamic = "force-dynamic";

const accountIdSchema = z.string().uuid("Acesso inválido.");

export async function DELETE(_request, { params }) {
  try {
    const owner = await requireOwner();
    const { id } = await params;
    const accountId = accountIdSchema.parse(id);
    const account = await deactivateManagerAccount(accountId, owner);

    revalidatePath("/admin");
    return noStoreJson({ ok: true, account });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
