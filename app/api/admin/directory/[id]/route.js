import { revalidatePath } from "next/cache";

import {
  archiveDirectoryEntry,
  updateDirectoryEntry,
} from "@/lib/data";
import { requireAdmin } from "@/lib/auth";

import {
  apiErrorResponse,
  noStoreJson,
  readJson,
  updateDirectorySchema,
} from "../../_shared";

export const dynamic = "force-dynamic";

function revalidateDirectory() {
  revalidatePath("/servicos");
  revalidatePath("/admin");
}

export async function PATCH(request, { params }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const input = updateDirectorySchema.parse(await readJson(request));
    const entry = await updateDirectoryEntry(
      id,
      {
        kind: input.kind,
        category: input.type,
        name: input.name,
        summary: input.description || "",
        address: input.address || "",
        phone: input.phone || "",
        hours: input.hours || "",
        icon: input.icon,
        color: input.color,
        tags: input.tags || [],
        active: true,
        sortOrder: input.sortOrder || 0,
        expectedVersion: input.expectedVersion,
      },
      session.email,
    );

    revalidateDirectory();
    return noStoreJson({ entry });
  } catch (error) {
    if (error?.message === "Cadastro não encontrado.") error.status = 409;
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const result = await archiveDirectoryEntry(id, session.email);

    revalidateDirectory();
    return noStoreJson({ ok: true, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
