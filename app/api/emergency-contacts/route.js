import { apiError } from "@/lib/api";
import { getEmergencyContacts } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ ok: true, contacts: await getEmergencyContacts() });
  } catch {
    return apiError("Contatos de emergência indisponíveis.", 503);
  }
}
