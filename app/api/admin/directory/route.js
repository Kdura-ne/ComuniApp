import { revalidatePath } from "next/cache";

import { createDirectoryEntry } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";

import {
  apiErrorResponse,
  createDirectorySchema,
  noStoreJson,
  readJson,
} from "../_shared";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const session = await requireAdmin();
    const input = createDirectorySchema.parse(await readJson(request));
    const entry = await createDirectoryEntry(
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
      },
      session.email,
    );

    revalidatePath("/servicos");
    revalidatePath("/admin");

    return noStoreJson({ entry }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
