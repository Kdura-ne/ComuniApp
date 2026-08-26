import { apiError, getVisitorId } from "@/lib/api";
import { getReportByProtocol } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request, context) {
  const { protocol } = await context.params;
  const report = await getReportByProtocol(protocol, { visitorId: getVisitorId(request) });
  if (!report) return apiError("Protocolo não encontrado.", 404);
  return Response.json({ ok: true, report });
}
