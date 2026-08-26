import { z } from "zod";

import {
  isAuthConfigurationError,
  setAdminSession,
  verifyAdminCredentials,
} from "@/lib/auth";
import { getRequestFingerprint } from "@/lib/api";
import { consumeRateLimit } from "@/lib/data";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(1024),
});

export async function POST(request) {
  let payload;

  try {
    payload = loginSchema.parse(await request.json());
  } catch (error) {
    return Response.json(
      {
        error: "Informe um e-mail e uma senha válidos.",
        issues: error instanceof z.ZodError ? error.issues : undefined,
      },
      { status: 400 },
    );
  }

  try {
    const rateLimit = await consumeRateLimit({
      fingerprint: getRequestFingerprint(request),
      action: "admin-login",
      maximum: 10,
      windowMinutes: 15,
    });
    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Muitas tentativas de acesso. Aguarde alguns minutos." },
        { status: 429 },
      );
    }

    const admin = await verifyAdminCredentials(payload.email, payload.password);

    if (!admin) {
      return Response.json(
        { error: "E-mail ou senha inválidos." },
        { status: 401 },
      );
    }

    await setAdminSession(admin);

    return Response.json(
      {
        ok: true,
        email: admin.email,
        role: admin.role,
        mustChangePassword: admin.mustChangePassword,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (isAuthConfigurationError(error)) {
      return Response.json(
        { error: "A autenticação administrativa ainda não foi configurada." },
        { status: 503 },
      );
    }

    console.error("Falha ao autenticar administrador", error);
    return Response.json(
      { error: "Não foi possível entrar agora. Tente novamente." },
      { status: 500 },
    );
  }
}
