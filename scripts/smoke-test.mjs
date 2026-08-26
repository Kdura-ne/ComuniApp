import { neon } from "@neondatabase/serverless";

const baseUrl = process.argv[2] || "http://127.0.0.1:3000";
const sql = neon(process.env.DATABASE_URL);
let reportId;
let directoryId;

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`✓ ${message}`);
}

function cookieFrom(response, name) {
  const header = response.headers.get("set-cookie") || "";
  const match = header.match(new RegExp(`(?:^|,\\s*)${name}=([^;]+)`));
  return match ? `${name}=${match[1]}` : "";
}

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path}: ${response.status} ${payload.error || "falhou"}`);
  return { response, payload };
}

async function cleanup() {
  if (directoryId) {
    await sql`delete from admin_audit_log where entity_id = ${directoryId}`;
    await sql`delete from directory_entries where id = ${directoryId}`;
  }
  if (reportId) {
    await sql`delete from admin_audit_log where entity_id = ${reportId}`;
    await sql`delete from reports where id = ${reportId}`;
  }
}

async function main() {
  const health = await jsonRequest("/api/health");
  check(health.payload.ok === true, "API e Neon respondem");

  const created = await jsonRequest("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope: "civic",
      category: "buraco",
      description: "Registro temporário criado pelo teste ponta a ponta do ComuniApp.",
      address: "Rua do Teste Automatizado, 101",
      region: "Centro",
      latitude: -23.550520,
      longitude: -46.633308,
      isAnonymous: false,
      reporterName: "Morador de Teste",
      reporterEmail: "qa@comuniapp.local",
    }),
  });
  reportId = created.payload.report.id;
  const protocol = created.payload.report.protocol;
  const visitorCookie = cookieFrom(created.response, "comuniapp_visitor");
  check(Boolean(reportId && protocol && visitorCookie), "denúncia com identificação privada gera ID, protocolo e sessão do visitante");

  const detail = await jsonRequest(`/api/reports/lookup/${encodeURIComponent(protocol)}`);
  check(detail.payload.report.protocol === protocol, "protocolo público é consultável");
  check(detail.payload.report.isAnonymous === true, "denúncia é sempre anônima na consulta pública");
  check(
    !("reporterName" in detail.payload.report) && !("reporterEmail" in detail.payload.report),
    "consulta pública não expõe a identificação do morador",
  );

  const voteHeaders = { Cookie: visitorCookie };
  const voted = await jsonRequest(`/api/reports/${reportId}/vote`, { method: "POST", headers: voteHeaders });
  check(voted.payload.voted === true, "apoio é persistido");
  const unvoted = await jsonRequest(`/api/reports/${reportId}/vote`, { method: "POST", headers: voteHeaders });
  check(unvoted.payload.voted === false, "apoio pode ser removido sem duplicidade");

  const login = await jsonRequest("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  });
  const adminCookie = cookieFrom(login.response, "comuniapp_admin_session");
  check(Boolean(adminCookie), "login administrativo cria cookie HttpOnly");

  const adminHeaders = { Cookie: adminCookie, "Content-Type": "application/json" };
  const adminDetail = await jsonRequest(`/api/admin/reports/${reportId}`, { headers: { Cookie: adminCookie } });
  check(adminDetail.payload.report.reporterName === "Morador de Teste", "nome obrigatório fica disponível somente no detalhe administrativo");
  check(adminDetail.payload.report.reporterEmail === "qa@comuniapp.local", "contato identificado fica disponível somente no detalhe administrativo");

  const reviewing = await jsonRequest(`/api/admin/reports/${reportId}`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ status: "in_review", expectedVersion: adminDetail.payload.report.version, note: "Triagem do teste." }),
  });
  check(reviewing.payload.report.status === "in_review", "gestão avança denúncia para análise");

  const resolved = await jsonRequest(`/api/admin/reports/${reportId}`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ status: "resolved", expectedVersion: reviewing.payload.report.version, note: "Ocorrência de teste validada e encerrada." }),
  });
  check(resolved.payload.report.status === "resolved", "gestão resolve com histórico e nota");

  const directoryCreated = await jsonRequest("/api/admin/directory", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      kind: "ngo",
      type: "Cultura",
      name: "Projeto Temporário de QA",
      description: "Cadastro criado apenas durante o teste automatizado.",
      icon: "🎸",
      color: "#7c3aed",
      tags: ["Teste"],
    }),
  });
  directoryId = directoryCreated.payload.entry.id;
  check(Boolean(directoryId), "gestão cria item do diretório");

  const directoryUpdated = await jsonRequest(`/api/admin/directory/${directoryId}`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      kind: "ngo",
      type: "Cultura",
      name: "Projeto Temporário de QA — editado",
      description: "Cadastro atualizado durante o teste automatizado.",
      icon: "🎸",
      color: "#7c3aed",
      tags: ["Teste", "Editado"],
      expectedVersion: directoryCreated.payload.entry.version,
    }),
  });
  check(directoryUpdated.payload.entry.version > directoryCreated.payload.entry.version, "gestão edita com controle de versão");

  const archived = await jsonRequest(`/api/admin/directory/${directoryId}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  check(archived.payload.ok === true, "gestão arquiva item com segurança");

  console.log("Smoke test full stack concluído.");
}

try {
  await main();
} finally {
  await cleanup();
}
