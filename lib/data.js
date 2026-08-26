import "server-only";

import { COMMUNITY, getCategory } from "@/lib/constants";
import { getSql } from "@/lib/db";
import { normalizeProtocol } from "@/lib/format";

function clampLimit(value, fallback = 30, maximum = 100) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), maximum) : fallback;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "");
}

function mapReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    protocol: row.protocol,
    scope: row.scope,
    title: row.title,
    description: row.description,
    category: row.category_slug,
    categorySlug: row.category_slug,
    categoryLabel: row.category_label,
    categoryShortLabel: row.category_short_label || row.category_label,
    categoryIcon: row.category_icon,
    address: row.address,
    region: row.region,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    // Identificação de morador nunca faz parte do contrato público.
    isAnonymous: true,
    status: row.status,
    priority: row.priority,
    votes: Number(row.vote_count || 0),
    hasVoted: Boolean(row.has_voted),
    hasImage: Boolean(row.has_image),
    imageUrl: row.has_image ? `/api/reports/${row.id}/image` : null,
    version: Number(row.version || 1),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
  };
}

function mapDirectoryEntry(row) {
  return {
    id: row.id,
    kind: row.kind,
    type: row.category,
    category: row.category,
    name: row.name,
    summary: row.summary || "",
    description: row.summary || "",
    address: row.address || "",
    phone: row.phone || "",
    hours: row.hours || "",
    icon: row.icon,
    color: row.color,
    tags: row.tags || [],
    active: row.active,
    sortOrder: Number(row.sort_order || 0),
    version: Number(row.version || 1),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const reportSelect = `
  select
    r.id, r.protocol, r.scope, r.title, r.description, r.category_slug,
    c.label as category_label, c.short_label as category_short_label, c.icon as category_icon,
    r.address, r.region, r.latitude, r.longitude, r.is_anonymous,
    r.status, r.priority, r.vote_count, r.version, r.created_at, r.updated_at, r.resolved_at,
    exists(select 1 from report_media m where m.report_id = r.id) as has_image
`;

export async function getReports(filters = {}, options = {}) {
  const sql = getSql();
  const values = [];
  const conditions = ["r.deleted_at is null"];

  if (filters.scope && ["civic", "security"].includes(filters.scope)) {
    values.push(filters.scope);
    conditions.push(`r.scope = $${values.length}`);
  }
  if (filters.status && ["open", "in_review", "resolved", "rejected"].includes(filters.status)) {
    values.push(filters.status);
    conditions.push(`r.status = $${values.length}`);
  }
  if (filters.category && /^[a-z0-9-]+$/.test(filters.category)) {
    values.push(filters.category);
    conditions.push(`r.category_slug = $${values.length}`);
  }
  if (filters.region && String(filters.region).length <= 60) {
    values.push(filters.region);
    conditions.push(`r.region = $${values.length}`);
  }

  const visitorId = isUuid(options.visitorId) ? options.visitorId : null;
  values.push(visitorId);
  const visitorPosition = values.length;
  values.push(clampLimit(filters.limit, 30));
  const limitPosition = values.length;

  const rows = await sql.query(
    `${reportSelect},
      case when $${visitorPosition}::uuid is null then false else exists(
        select 1 from report_votes v where v.report_id = r.id and v.visitor_id = $${visitorPosition}::uuid
      ) end as has_voted
     from reports r
     join report_categories c on c.slug = r.category_slug
     where ${conditions.join(" and ")}
     order by r.created_at desc
     limit $${limitPosition}`,
    values,
  );

  return rows.map(mapReport);
}

export async function getHomeData(options = {}) {
  const sql = getSql();
  const [statsRows, recentReports] = await Promise.all([
    sql`
      select
        count(*) filter (
          where status = 'resolved'
            and resolved_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'
        )::int as resolved_today,
        count(*) filter (
          where status = 'resolved'
            and resolved_at >= date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'
        )::int as resolved_month,
        count(*) filter (
          where created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'
        )::int as reports_today,
        count(*) filter (where deleted_at is null)::int as total_reports
      from reports
    `,
    getReports({ limit: 5 }, options),
  ]);

  const stats = statsRows[0] || {};
  return {
    community: COMMUNITY,
    stats: {
      resolvedToday: Number(stats.resolved_today || 0),
      resolvedMonth: Number(stats.resolved_month || 0),
      reportsToday: Number(stats.reports_today || 0),
      totalReports: Number(stats.total_reports || 0),
    },
    recentReports,
    reports: recentReports,
  };
}

export async function getReportByProtocol(protocol, options = {}) {
  const sql = getSql();
  const normalized = normalizeProtocol(protocol);
  const visitorId = isUuid(options.visitorId) ? options.visitorId : null;
  const rows = await sql.query(
    `${reportSelect},
      case when $2::uuid is null then false else exists(
        select 1 from report_votes v where v.report_id = r.id and v.visitor_id = $2::uuid
      ) end as has_voted
     from reports r
     join report_categories c on c.slug = r.category_slug
     where r.protocol = $1 and r.deleted_at is null
     limit 1`,
    [normalized, visitorId],
  );
  const report = mapReport(rows[0]);
  if (!report) return null;

  const history = await sql`
    select from_status, to_status, note, created_at
    from report_status_history
    where report_id = ${report.id} and visible_to_public = true
    order by created_at asc
  `;

  return {
    ...report,
    history: history.map((entry) => ({
      fromStatus: entry.from_status,
      toStatus: entry.to_status,
      note: entry.note || "",
      createdAt: entry.created_at,
    })),
  };
}

export async function getReportById(reportId, options = {}) {
  if (!isUuid(reportId) || options.admin !== true) return null;
  const sql = getSql();
  const rows = await sql.query(
    `${reportSelect}, r.reporter_name, r.reporter_email, false as has_voted
     from reports r
     join report_categories c on c.slug = r.category_slug
     where r.id = $1 and r.deleted_at is null
     limit 1`,
    [reportId],
  );
  const report = mapReport(rows[0]);
  if (!report) return null;
  const history = await sql`
    select id, from_status, to_status, note, changed_by, visible_to_public, created_at
    from report_status_history
    where report_id = ${reportId}
    order by created_at asc
  `;
  const mappedHistory = history.map((entry) => ({
    id: entry.id,
    fromStatus: entry.from_status,
    toStatus: entry.to_status,
    note: entry.note || "",
    changedBy: entry.changed_by,
    visibleToPublic: entry.visible_to_public,
    createdAt: entry.created_at,
  }));
  return {
    ...report,
    reporterName: rows[0].reporter_name || "",
    reporterEmail: rows[0].reporter_email || "",
    history: mappedHistory,
    statusHistory: mappedHistory,
  };
}

export async function getDirectoryEntries(filters = {}) {
  const sql = getSql();
  const values = [];
  const conditions = ["archived_at is null"];

  if (filters.includeInactive !== true) conditions.push("active = true");
  if (filters.kind && ["public_service", "ngo"].includes(filters.kind)) {
    values.push(filters.kind);
    conditions.push(`kind = $${values.length}`);
  }
  if (filters.category && String(filters.category).length <= 40) {
    values.push(filters.category);
    conditions.push(`category = $${values.length}`);
  }

  const rows = await sql.query(
    `select id, kind, category, name, summary, address, phone, hours, icon, color,
            tags, active, sort_order, version, created_at, updated_at
     from directory_entries
     where ${conditions.join(" and ")}
     order by kind asc, sort_order asc, name asc`,
    values,
  );
  return rows.map(mapDirectoryEntry);
}

export async function getEmergencyContacts() {
  const sql = getSql();
  const rows = await sql`
    select id, label, phone_digits as number, description, icon, color
    from emergency_contacts
    where active = true
    order by sort_order asc, id asc
  `;
  return rows.map((row) => ({ ...row, desc: row.description }));
}

export async function createReport(input, options = {}) {
  const sql = getSql();
  if (!isUuid(options.visitorId)) throw new Error("Identificador do visitante inválido.");
  const category = getCategory(input.category);
  const title = input.title || `${category?.shortLabel || "Ocorrência"} — ${input.address}`;
  const base64 = input.image?.base64?.replace(/^data:[^;]+;base64,/, "") || null;
  const mimeType = input.image?.mimeType || null;

  if (base64) {
    const rows = await sql`
      with created as (
        insert into reports (
          visitor_id, category_slug, scope, title, description, address, region,
          reporter_name, reporter_email,
          latitude, longitude, is_anonymous
        ) values (
          ${options.visitorId}, ${input.category}, ${input.scope}, ${title}, ${input.description},
          ${input.address}, ${input.region || "Centro"}, ${input.reporterName}, ${input.reporterEmail},
          ${input.latitude}, ${input.longitude}, true
        )
        returning id, protocol, created_at, status
      ), media as (
        insert into report_media (report_id, mime_type, data)
        select id, ${mimeType}, decode(${base64}, 'base64')
        from created
        returning report_id
      ), history as (
        insert into report_status_history (report_id, from_status, to_status, note, changed_by, visible_to_public)
        select id, null, 'open', 'Denúncia registrada.', 'visitor', true from created
        returning id
      )
      select created.id, created.protocol, created.created_at, created.status, true as has_image
      from created
    `;
    return rows[0];
  }

  const rows = await sql`
    with created as (
      insert into reports (
        visitor_id, category_slug, scope, title, description, address, region,
        reporter_name, reporter_email,
        latitude, longitude, is_anonymous
      ) values (
        ${options.visitorId}, ${input.category}, ${input.scope}, ${title}, ${input.description},
        ${input.address}, ${input.region || "Centro"}, ${input.reporterName}, ${input.reporterEmail},
        ${input.latitude}, ${input.longitude}, true
      )
      returning id, protocol, created_at, status
    ), history as (
      insert into report_status_history (report_id, from_status, to_status, note, changed_by, visible_to_public)
      select id, null, 'open', 'Denúncia registrada.', 'visitor', true from created
      returning id
    )
    select id, protocol, created_at, status, false as has_image from created
  `;
  return rows[0];
}

export async function consumeRateLimit({ fingerprint, action, maximum = 5, windowMinutes = 60 }) {
  const sql = getSql();
  const now = Date.now();
  const windowMs = windowMinutes * 60_000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs).toISOString();
  const rows = await sql`
    with cleanup as (
      delete from rate_limits where expires_at < now()
    ), consumed as (
      insert into rate_limits (fingerprint, action, window_start, request_count, expires_at)
      values (${fingerprint}, ${action}, ${windowStart}, 1, ${new Date(now + windowMs * 2).toISOString()})
      on conflict (fingerprint, action, window_start)
      do update set request_count = rate_limits.request_count + 1
      returning request_count
    )
    select request_count from consumed
  `;
  return { allowed: Number(rows[0].request_count) <= maximum, remaining: Math.max(0, maximum - Number(rows[0].request_count)) };
}

export async function toggleReportVote(reportId, visitorId) {
  if (!isUuid(reportId) || !isUuid(visitorId)) throw new Error("Identificador de voto inválido.");
  const sql = getSql();
  const rows = await sql`
    with removed as (
      delete from report_votes
      where report_id = ${reportId} and visitor_id = ${visitorId}
      returning report_id
    ), added as (
      insert into report_votes (report_id, visitor_id)
      select ${reportId}, ${visitorId}
      where not exists (select 1 from removed)
        and exists (select 1 from reports where id = ${reportId} and deleted_at is null)
      on conflict do nothing
      returning report_id
    ), changed as (
      update reports
      set vote_count = greatest(0, vote_count + case when exists(select 1 from added) then 1 else -1 end),
          updated_at = now()
      where id = ${reportId} and deleted_at is null
      returning vote_count
    )
    select
      coalesce((select vote_count from changed), 0)::int as votes,
      exists(select 1 from added) as voted
  `;
  return { votes: Number(rows[0]?.votes || 0), voted: Boolean(rows[0]?.voted) };
}

export async function getReportImage(reportId) {
  if (!isUuid(reportId)) return null;
  const sql = getSql();
  const rows = await sql`
    select mime_type, encode(data, 'base64') as base64, byte_size
    from report_media
    where report_id = ${reportId}
    limit 1
  `;
  return rows[0] || null;
}

export async function getAdminDashboard() {
  const sql = getSql();
  const [statsRows, reports, directory] = await Promise.all([
    sql`
      select
        count(*) filter (where deleted_at is null)::int as total,
        count(*) filter (where status = 'open' and deleted_at is null)::int as open,
        count(*) filter (where status = 'in_review' and deleted_at is null)::int as in_review,
        count(*) filter (where status = 'resolved' and deleted_at is null)::int as resolved
      from reports
    `,
    getReports({ limit: 100 }),
    getDirectoryEntries({ includeInactive: true }),
  ]);
  const row = statsRows[0] || {};
  return {
    stats: {
      total: Number(row.total || 0),
      open: Number(row.open || 0),
      inReview: Number(row.in_review || 0),
      resolved: Number(row.resolved || 0),
    },
    reports,
    directory,
    services: directory,
  };
}

export async function updateReportStatus(reportId, input, actorEmail) {
  if (!isUuid(reportId)) throw new Error("Denúncia inválida.");
  const sql = getSql();
  const rows = await sql`
    with current as (
      select id, status, version
      from reports
      where id = ${reportId} and deleted_at is null
    ), updated as (
      update reports r
      set status = ${input.status},
          resolution_note = case when ${input.status} = 'resolved' then ${input.note || ""} else r.resolution_note end,
          resolved_at = case when ${input.status} = 'resolved' then now() else null end,
          updated_at = now(), version = r.version + 1
      from current c
      where r.id = c.id
        and (${input.expectedVersion || null}::int is null or c.version = ${input.expectedVersion || null})
        and c.status <> ${input.status}
        and (
          (c.status = 'open' and ${input.status} in ('in_review', 'rejected'))
          or (c.status = 'in_review' and ${input.status} in ('open', 'resolved', 'rejected'))
          or (c.status = 'resolved' and ${input.status} = 'open')
          or (c.status = 'rejected' and ${input.status} = 'open')
        )
      returning r.id, r.protocol, r.status, r.version, c.status as previous_status
    ), history as (
      insert into report_status_history (report_id, from_status, to_status, note, changed_by, visible_to_public)
      select id, previous_status, status, ${input.note || ""}, ${actorEmail}, true from updated
      returning id
    ), audit as (
      insert into admin_audit_log (actor_email, action, entity_type, entity_id, old_data, new_data)
      select ${actorEmail}, 'report.status_changed', 'report', id,
             jsonb_build_object('status', previous_status),
             jsonb_build_object('status', status, 'note', ${input.note || ""}::text)
      from updated
      returning id
    )
    select id, protocol, status, version, previous_status from updated
  `;
  if (!rows[0]) throw new Error("A denúncia foi alterada por outra pessoa ou já está neste status.");
  return rows[0];
}

export async function createDirectoryEntry(input, actorEmail) {
  const sql = getSql();
  const rows = await sql`
    with created as (
      insert into directory_entries (
        kind, category, name, summary, address, phone, hours, icon, color, tags, active, sort_order
      ) values (
        ${input.kind}, ${input.category}, ${input.name}, ${input.summary || null}, ${input.address || null},
        ${input.phone || null}, ${input.hours || null}, ${input.icon}, ${input.color}, ${input.tags}, ${input.active}, ${input.sortOrder || 0}
      )
      returning *
    ), audit as (
      insert into admin_audit_log (actor_email, action, entity_type, entity_id, new_data)
      select ${actorEmail}, 'directory.created', 'directory_entry', id, to_jsonb(created) from created
      returning id
    )
    select id, kind, category, name, summary, address, phone, hours, icon, color, tags, active, sort_order, version, created_at, updated_at
    from created
  `;
  return mapDirectoryEntry(rows[0]);
}

export async function updateDirectoryEntry(entryId, input, actorEmail) {
  if (!isUuid(entryId)) throw new Error("Cadastro inválido.");
  const sql = getSql();
  const rows = await sql`
    with previous as (
      select * from directory_entries where id = ${entryId} and archived_at is null
    ), updated as (
      update directory_entries d
      set kind = ${input.kind}, category = ${input.category}, name = ${input.name}, summary = ${input.summary || null},
          address = ${input.address || null}, phone = ${input.phone || null}, hours = ${input.hours || null}, icon = ${input.icon},
          color = ${input.color}, tags = ${input.tags}, active = ${input.active}, sort_order = ${input.sortOrder || 0},
          updated_at = now(), version = d.version + 1
      from previous p
      where d.id = p.id
        and (${input.expectedVersion || null}::int is null or p.version = ${input.expectedVersion || null})
      returning d.*
    ), audit as (
      insert into admin_audit_log (actor_email, action, entity_type, entity_id, old_data, new_data)
      select ${actorEmail}, 'directory.updated', 'directory_entry', u.id,
             to_jsonb(p), to_jsonb(u)
      from updated u cross join previous p
      returning id
    )
    select id, kind, category, name, summary, address, phone, hours, icon, color, tags, active, sort_order, version, created_at, updated_at
    from updated
  `;
  if (!rows[0]) throw new Error("Cadastro não encontrado.");
  return mapDirectoryEntry(rows[0]);
}

export async function archiveDirectoryEntry(entryId, actorEmail) {
  if (!isUuid(entryId)) throw new Error("Cadastro inválido.");
  const sql = getSql();
  const rows = await sql`
    with archived as (
      update directory_entries
      set archived_at = now(), active = false, updated_at = now(), version = version + 1
      where id = ${entryId} and archived_at is null
      returning id, name
    ), audit as (
      insert into admin_audit_log (actor_email, action, entity_type, entity_id, old_data)
      select ${actorEmail}, 'directory.archived', 'directory_entry', id, jsonb_build_object('name', name)
      from archived
      returning id
    )
    select id, name from archived
  `;
  if (!rows[0]) throw new Error("Cadastro não encontrado.");
  return rows[0];
}
