import { revalidatePath } from "next/cache";

import { apiError, ensureVisitorId, setVisitorCookie } from "@/lib/api";
import { toggleReportVote } from "@/lib/data";

export async function POST(request, context) {
  try {
    const { id } = await context.params;
    const visitorId = ensureVisitorId(request);
    const result = await toggleReportVote(id, visitorId);
    revalidatePath("/");
    revalidatePath("/mapa");
    revalidatePath(`/ocorrencias/${id}`);
    const response = Response.json({ ok: true, ...result });
    return setVisitorCookie(response, visitorId);
  } catch {
    return apiError("Não foi possível registrar seu apoio.", 400);
  }
}
