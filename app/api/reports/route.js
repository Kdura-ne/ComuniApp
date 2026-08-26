import { revalidatePath } from "next/cache";

import { apiError, ensureVisitorId, getRequestFingerprint, getVisitorId, readJson, setVisitorCookie } from "@/lib/api";
import { consumeRateLimit, createReport, getReports } from "@/lib/data";
import { parseJsonBody, reportInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  try {
    const reports = await getReports(
      {
        scope: params.get("scope"),
        status: params.get("status"),
        category: params.get("category"),
        region: params.get("region"),
        limit: params.get("limit"),
      },
      { visitorId: getVisitorId(request) },
    );
    return Response.json({ ok: true, reports });
  } catch {
    return apiError("Não foi possível carregar as ocorrências.", 503);
  }
}

export async function POST(request) {
  try {
    const raw = await readJson(request);
    if (raw?.image?.data && !raw.image.base64) raw.image.base64 = raw.image.data;
    if (raw?.photo && !raw.image) raw.image = raw.photo;
    const parsed = parseJsonBody(reportInputSchema, raw);
    if (!parsed.ok) return apiError(parsed.error, 422, parsed.issues);

    if (parsed.data.image?.base64) {
      const clean = parsed.data.image.base64.replace(/^data:[^;]+;base64,/, "");
      if (Buffer.byteLength(clean, "base64") > 1_000_000) {
        return apiError("A foto deve ter no máximo 1 MB após a compressão.", 413);
      }
      parsed.data.image.base64 = clean;
    }

    const limit = await consumeRateLimit({
      fingerprint: getRequestFingerprint(request),
      action: "create-report",
      maximum: 5,
      windowMinutes: 60,
    });
    if (!limit.allowed) return apiError("Muitas denúncias foram enviadas deste dispositivo. Tente novamente mais tarde.", 429);

    const visitorId = ensureVisitorId(request);
    const report = await createReport(parsed.data, { visitorId });
    revalidatePath("/");
    revalidatePath("/mapa");
    revalidatePath("/seguranca");
    revalidatePath("/admin");

    const response = Response.json({ ok: true, report }, { status: 201 });
    return setVisitorCookie(response, visitorId);
  } catch (error) {
    const message = error instanceof SyntaxError ? "O conteúdo enviado não é JSON válido." : "Não foi possível registrar a denúncia.";
    return apiError(message, error instanceof SyntaxError ? 400 : 500);
  }
}
