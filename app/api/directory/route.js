import { apiError } from "@/lib/api";
import { getDirectoryEntries } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const params = request.nextUrl.searchParams;
    const entries = await getDirectoryEntries({ kind: params.get("kind"), category: params.get("category") });
    return Response.json({ ok: true, entries });
  } catch {
    return apiError("Não foi possível carregar o diretório.", 503);
  }
}
