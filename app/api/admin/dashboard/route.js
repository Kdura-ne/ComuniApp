import { getAdminDashboard } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";

import { apiErrorResponse, noStoreJson } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const dashboard = await getAdminDashboard();

    return noStoreJson({
      ...dashboard,
      directoryEntries:
        dashboard.directoryEntries || dashboard.directory || dashboard.services || [],
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
