import { getReportById } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";

import { apiErrorResponse, noStoreJson } from "../../_shared";
import { PATCH as updateReport } from "./status/route";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;

    if (!id) {
      return noStoreJson({ error: "Denúncia não informada." }, { status: 400 });
    }

    const report = await getReportById(id, { admin: true });

    if (!report) {
      return noStoreJson({ error: "Denúncia não encontrada." }, { status: 404 });
    }

    return noStoreJson({ report });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request, context) {
  return updateReport(request, context);
}
