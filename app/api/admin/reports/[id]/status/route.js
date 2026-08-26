import { revalidatePath } from "next/cache";

import { getReportById, updateReportStatus } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";

import {
  apiErrorResponse,
  noStoreJson,
  readJson,
  reportStatusSchema,
} from "../../../_shared";

export const dynamic = "force-dynamic";

const ALLOWED_TRANSITIONS = {
  open: ["in_review"],
  in_review: ["resolved"],
  resolved: ["open"],
  rejected: ["open"],
};

export async function PATCH(request, { params }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const input = reportStatusSchema.parse(await readJson(request));
    const current = await getReportById(id, { admin: true });

    if (!current) {
      return noStoreJson({ error: "Denúncia não encontrada." }, { status: 404 });
    }

    if (current.version !== input.expectedVersion) {
      return noStoreJson(
        { error: "A denúncia foi atualizada por outra sessão." },
        { status: 409 },
      );
    }

    if (!ALLOWED_TRANSITIONS[current.status]?.includes(input.status)) {
      return noStoreJson(
        { error: "Transição de status não permitida." },
        { status: 422 },
      );
    }

    if (
      ["resolved", "rejected"].includes(current.status) &&
      (input.note?.trim().length || 0) < 3
    ) {
      return noStoreJson(
        { error: "Informe o motivo da reabertura." },
        { status: 422 },
      );
    }

    await updateReportStatus(id, input, session.email);
    const report = await getReportById(id, { admin: true });

    revalidatePath("/");
    revalidatePath("/mapa");
    revalidatePath("/seguranca");
    revalidatePath("/admin");

    return noStoreJson({ report });
  } catch (error) {
    if (error?.message?.includes("alterada por outra pessoa")) {
      error.status = 409;
    }
    return apiErrorResponse(error);
  }
}
