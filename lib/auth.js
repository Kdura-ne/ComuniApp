import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { getSql } from "@/lib/db";
import { hashAdminPassword, verifyAdminPassword } from "@/lib/password";

export const ADMIN_COOKIE_NAME = "comuniapp_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

const SESSION_ISSUER = "comuniapp";
const SESSION_AUDIENCE = "comuniapp-admin";
let dummyPasswordHash;

export class AuthenticationError extends Error {
  constructor(message = "Autenticação administrativa necessária.") {
    super(message);
    this.name = "AuthenticationError";
    this.status = 401;
  }
}

export class AuthorizationError extends Error {
  constructor(message = "Esta ação exige acesso de proprietário.") {
    super(message);
    this.name = "AuthorizationError";
    this.status = 403;
  }
}

export class AuthConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthConfigurationError";
    this.status = 503;
  }
}

function mapAdmin(row) {
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    active: Boolean(row.active),
    mustChangePassword: Boolean(row.must_change_password),
    sessionVersion: Number(row.session_version),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

function getSigningKey() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new AuthConfigurationError(
      "SESSION_SECRET deve ter pelo menos 32 caracteres.",
    );
  }

  return new TextEncoder().encode(secret);
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  };
}

async function getDummyPasswordHash() {
  if (!dummyPasswordHash) {
    dummyPasswordHash = hashAdminPassword("invalid-login-attempt");
  }

  return dummyPasswordHash;
}

export async function verifyAdminCredentials(inputEmail, inputPassword) {
  const sql = getSql();
  const email = String(inputEmail ?? "").trim().toLowerCase();
  const rows = await sql`
    select id, email, password_hash, role, active, must_change_password,
           session_version, last_login_at, created_at
    from admin_users
    where lower(email) = ${email}
    limit 1
  `;
  const row = rows[0];
  const passwordHash = row?.password_hash || (await getDummyPasswordHash());
  const passwordMatches = await verifyAdminPassword(inputPassword, passwordHash);

  if (!row || !row.active || !passwordMatches) return null;

  const [updated] = await sql`
    update admin_users
    set last_login_at = now()
    where id = ${row.id}
    returning id, email, role, active, must_change_password,
              session_version, last_login_at, created_at
  `;

  return mapAdmin(updated);
}

export async function createAdminSession(admin) {
  return new SignJWT({
    role: admin.role,
    email: admin.email,
    version: admin.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE}s`)
    .sign(getSigningKey());
}

export async function setAdminSession(admin) {
  const token = await createAdminSession(admin);
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, token, cookieOptions());

  return token;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    ...cookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) return null;

  let payload;

  try {
    ({ payload } = await jwtVerify(token, getSigningKey(), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    }));
  } catch {
    return null;
  }

  if (
    typeof payload.sub !== "string" ||
    typeof payload.version !== "number"
  ) {
    return null;
  }

  const sql = getSql();
  const rows = await sql`
    select id, email, role, active, must_change_password,
           session_version, last_login_at, created_at
    from admin_users
    where id = ${payload.sub}
      and active = true
      and session_version = ${payload.version}
    limit 1
  `;

  return mapAdmin(rows[0]);
}

export async function requireAdmin({ allowTemporaryPassword = false } = {}) {
  const session = await getAdminSession();

  if (!session) throw new AuthenticationError();

  if (session.mustChangePassword && !allowTemporaryPassword) {
    throw new AuthorizationError(
      "Troque a senha temporária em Conta e acessos antes de continuar.",
    );
  }

  return session;
}

export async function requireOwner() {
  const session = await requireAdmin();

  if (session.role !== "owner") throw new AuthorizationError();

  return session;
}

export async function updateOwnAdminAccount(admin, input) {
  const sql = getSql();
  const rows = await sql`
    select password_hash
    from admin_users
    where id = ${admin.id} and active = true
    limit 1
  `;
  const current = rows[0];

  if (!current || !(await verifyAdminPassword(input.currentPassword, current.password_hash))) {
    const error = new Error("A senha atual está incorreta.");
    error.status = 400;
    throw error;
  }

  if (admin.mustChangePassword && !input.newPassword) {
    const error = new Error("Defina uma nova senha para concluir o primeiro acesso.");
    error.status = 400;
    throw error;
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const passwordHash = input.newPassword
    ? await hashAdminPassword(input.newPassword)
    : null;
  const [updated] = await sql`
    with previous as (
      select id, email, role, must_change_password
      from admin_users
      where id = ${admin.id} and active = true
    ), changed as (
      update admin_users u
      set email = ${normalizedEmail},
          password_hash = coalesce(${passwordHash}, u.password_hash),
          must_change_password = case when ${Boolean(passwordHash)} then false else u.must_change_password end,
          session_version = u.session_version + 1,
          updated_at = now()
      from previous p
      where u.id = p.id
      returning u.id, u.email, u.role, u.active, u.must_change_password,
                u.session_version, u.last_login_at, u.created_at,
                p.email as previous_email
    ), audit as (
      insert into admin_audit_log (actor_email, action, entity_type, entity_id, old_data, new_data)
      select previous_email, 'admin.account_updated', 'admin_user', id,
             jsonb_build_object('email', previous_email),
             jsonb_build_object('email', email, 'password_changed', ${Boolean(passwordHash)})
      from changed
      returning id
    )
    select * from changed
  `;

  if (!updated) throw new AuthenticationError();

  return mapAdmin(updated);
}

export async function listAdminAccounts() {
  const sql = getSql();
  const rows = await sql`
    select id, email, role, active, must_change_password,
           session_version, last_login_at, created_at
    from admin_users
    where active = true
    order by case role when 'owner' then 0 else 1 end, created_at, email
  `;

  return rows.map(mapAdmin);
}

export async function createManagerAccount(input, actor) {
  const sql = getSql();
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashAdminPassword(input.password);
  const [created] = await sql`
    with existing as (
      select id, role, active
      from admin_users
      where lower(email) = ${email}
      limit 1
    ), reactivated as (
      update admin_users u
      set password_hash = ${passwordHash},
          active = true,
          must_change_password = true,
          session_version = u.session_version + 1,
          last_login_at = null,
          created_by = ${actor.id},
          updated_at = now()
      from existing e
      where u.id = e.id
        and e.role = 'manager'
        and e.active = false
      returning u.id, u.email, u.role, u.active, u.must_change_password,
                u.session_version, u.last_login_at, u.created_at,
                true as was_reactivated
    ), inserted as (
      insert into admin_users (email, password_hash, role, must_change_password, created_by)
      select ${email}, ${passwordHash}, 'manager', true, ${actor.id}
      where not exists (select 1 from existing)
      returning id, email, role, active, must_change_password,
                session_version, last_login_at, created_at,
                false as was_reactivated
    ), changed as (
      select * from reactivated
      union all
      select * from inserted
    ), audit as (
      insert into admin_audit_log (actor_email, action, entity_type, entity_id, new_data)
      select ${actor.email},
             case when was_reactivated then 'admin.reactivated' else 'admin.created' end,
             'admin_user', id,
             jsonb_build_object(
               'email', email,
               'role', role,
               'reactivated', was_reactivated
             )
      from changed
      returning id
    )
    select * from changed
  `;

  if (!created) {
    const error = new Error("Já existe um acesso ativo com este e-mail.");
    error.status = 409;
    throw error;
  }

  return mapAdmin(created);
}

export async function deactivateManagerAccount(accountId, actor) {
  const sql = getSql();
  const rows = await sql`
    with target as (
      select id, email, role, active
      from admin_users
      where id = ${accountId}
      limit 1
    ), changed as (
      update admin_users u
      set active = false,
          session_version = u.session_version + 1,
          updated_at = now()
      from target t
      where u.id = t.id
        and t.role = 'manager'
        and t.active = true
      returning u.id, u.email, u.role, u.active, u.must_change_password,
                u.session_version, u.last_login_at, u.created_at
    ), audit as (
      insert into admin_audit_log (actor_email, action, entity_type, entity_id, old_data, new_data)
      select ${actor.email}, 'admin.deactivated', 'admin_user', id,
             jsonb_build_object('email', email, 'role', role, 'active', true),
             jsonb_build_object('email', email, 'role', role, 'active', active)
      from changed
      returning id
    )
    select t.id as target_id,
           t.role as target_role,
           t.active as was_active,
           c.id, c.email, c.role, c.active, c.must_change_password,
           c.session_version, c.last_login_at, c.created_at
    from target t
    left join changed c on c.id = t.id
  `;
  const result = rows[0];

  if (!result) {
    const error = new Error("Acesso não encontrado.");
    error.status = 404;
    throw error;
  }

  if (result.target_role !== "manager") {
    throw new AuthorizationError(
      "Contas de proprietário não podem ser desativadas por esta opção.",
    );
  }

  if (!result.was_active || !result.id) {
    const error = new Error("Este acesso já está desativado.");
    error.status = 409;
    throw error;
  }

  return mapAdmin(result);
}

export function isAuthenticationError(error) {
  return error instanceof AuthenticationError;
}

export function isAuthorizationError(error) {
  return error instanceof AuthorizationError;
}

export function isAuthConfigurationError(error) {
  return error instanceof AuthConfigurationError;
}
