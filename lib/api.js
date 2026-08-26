import { createHash, randomUUID } from "node:crypto";

export const VISITOR_COOKIE = "comuniapp_visitor";

export function apiError(message, status = 400, details) {
  return Response.json({ ok: false, error: message, ...(details ? { details } : {}) }, { status });
}

export function getVisitorId(request) {
  const value = request.cookies.get(VISITOR_COOKIE)?.value;
  return /^[0-9a-f-]{36}$/i.test(value || "") ? value : null;
}

export function ensureVisitorId(request) {
  return getVisitorId(request) || randomUUID();
}

export function setVisitorCookie(response, visitorId) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.headers.append(
    "Set-Cookie",
    `${VISITOR_COOKIE}=${visitorId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}`,
  );
  return response;
}

export function getRequestFingerprint(request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "local";
  const agent = request.headers.get("user-agent") || "unknown";
  const secret = process.env.SESSION_SECRET || "comuniapp-rate-limit";
  return createHash("sha256").update(`${secret}:${ip}:${agent}`).digest("hex");
}

export async function readJson(request, maximumBytes = 1_700_000) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maximumBytes) throw new Error("O envio excede o limite permitido.");
  return request.json();
}
