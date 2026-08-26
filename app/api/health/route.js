import { checkDatabaseConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await checkDatabaseConnection();
    return Response.json({ ok: true, database: result.database, checkedAt: result.checked_at });
  } catch {
    return Response.json({ ok: false, error: "Banco de dados indisponível." }, { status: 503 });
  }
}
