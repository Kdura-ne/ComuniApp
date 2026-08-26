import { neon } from '@neondatabase/serverless'
import { verifyAdminPassword } from '../lib/password.js'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be configured.')
}

if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  throw new Error('The configured database URL is not a PostgreSQL connection string.')
}

const sql = neon(databaseUrl)

const requiredColumns = {
  report_categories: ['slug', 'label', 'short_label', 'icon', 'scope', 'sort_order', 'active'],
  reports: [
    'id',
    'protocol',
    'visitor_id',
    'category_slug',
    'scope',
    'title',
    'description',
    'address',
    'region',
    'latitude',
    'longitude',
    'is_anonymous',
    'reporter_name',
    'reporter_email',
    'status',
    'priority',
    'vote_count',
    'version',
    'deleted_at',
  ],
  report_votes: ['report_id', 'visitor_id', 'created_at'],
  report_status_history: [
    'id',
    'report_id',
    'from_status',
    'to_status',
    'note',
    'changed_by',
    'visible_to_public',
    'created_at',
  ],
  report_media: ['id', 'report_id', 'data', 'mime_type', 'byte_size'],
  directory_entries: [
    'id',
    'kind',
    'category',
    'name',
    'summary',
    'address',
    'phone',
    'hours',
    'icon',
    'color',
    'tags',
    'active',
    'archived_at',
    'version',
  ],
  emergency_contacts: ['id', 'label', 'phone_digits', 'icon', 'description', 'color', 'sort_order', 'active'],
  admin_users: [
    'id',
    'email',
    'password_hash',
    'role',
    'active',
    'must_change_password',
    'session_version',
    'last_login_at',
    'created_at',
    'updated_at',
  ],
  admin_audit_log: ['id', 'actor_email', 'action', 'entity_type', 'entity_id', 'old_data', 'new_data'],
  rate_limits: ['fingerprint', 'action', 'window_start', 'request_count', 'expires_at'],
}

function check(condition, message) {
  if (!condition) {
    throw new Error(message)
  }

  console.log(`✓ ${message}`)
}

async function verifyTablesAndColumns() {
  for (const [tableName, expectedColumns] of Object.entries(requiredColumns)) {
    const [{ relation }] = await sql.query('SELECT to_regclass($1) AS relation', [`public.${tableName}`])
    check(Boolean(relation), `table ${tableName} exists`)

    const rows = await sql.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`,
      [tableName],
    )
    const actualColumns = new Set(rows.map((row) => row.column_name))
    const missingColumns = expectedColumns.filter((column) => !actualColumns.has(column))
    check(missingColumns.length === 0, `table ${tableName} has all required columns`)
  }
}

async function verifySeedData() {
  const [counts] = await sql.query(
    `SELECT
       (SELECT count(*)::int FROM report_categories WHERE active = true) AS categories,
       (SELECT count(*)::int FROM reports WHERE deleted_at IS NULL) AS reports,
       (SELECT count(*)::int FROM report_status_history) AS history,
       (SELECT count(*)::int FROM directory_entries WHERE active = true AND archived_at IS NULL) AS directory_entries,
       (SELECT count(*)::int FROM emergency_contacts WHERE active = true) AS emergency_contacts,
       (SELECT count(*)::int FROM admin_users WHERE active = true) AS admin_users,
       (SELECT count(*)::int FROM admin_users WHERE active = true AND role = 'owner') AS admin_owners`,
    [],
  )

  check(counts.categories >= 12, 'canonical report categories are seeded')
  check(counts.reports >= 9, 'prototype reports are seeded')
  check(counts.history >= 14, 'report status history is seeded')
  check(counts.directory_entries >= 10, 'public services and NGOs are seeded')
  check(counts.emergency_contacts >= 5, 'emergency contacts are seeded')
  check(counts.admin_users >= 1, 'at least one administrative account exists')
  check(counts.admin_owners >= 1, 'an active owner account exists')

  const [protocols] = await sql.query(
    `SELECT count(*)::int AS count
     FROM reports
     WHERE protocol IN ($1, $2, $3, $4, $5, $6)`,
    ['D2026-001', 'D2026-002', 'D2026-003', 'D2026-004', 'D2026-005', 'D2026-006'],
  )
  check(protocols.count === 6, 'administrative prototype protocols are present')
}

async function verifyDevelopmentOwner() {
  const email = process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.DEV_ADMIN_PASSWORD

  if (!email && !password) return

  check(Boolean(email && password), 'development owner credentials are fully configured')

  const rows = await sql.query(
    `SELECT email, password_hash, role, active, must_change_password
     FROM admin_users
     WHERE lower(email) = $1
     LIMIT 1`,
    [email],
  )
  const owner = rows[0]

  check(Boolean(owner), 'configured development owner exists')
  check(owner.role === 'owner', 'development account has owner access')
  check(owner.active === true, 'development owner is active')
  check(owner.must_change_password === false, 'development owner has no forced account update')
  check(
    await verifyAdminPassword(password, owner.password_hash),
    'development owner credentials are valid',
  )
}

async function verifyIntegrity() {
  const [integrity] = await sql.query(
    `SELECT
       count(*) FILTER (
         WHERE c.scope <> 'both' AND c.scope <> r.scope
       )::int AS category_scope_mismatches,
       count(*) FILTER (WHERE r.vote_count < 0)::int AS negative_vote_counts,
       count(*) FILTER (WHERE r.is_anonymous IS DISTINCT FROM true)::int AS publicly_identified_reports,
       count(*) FILTER (
         WHERE r.reporter_name IS NULL
            OR char_length(btrim(r.reporter_name)) < 2
            OR r.reporter_email IS NULL
            OR r.reporter_email !~* '^[A-Z0-9._%+\\-]+@[A-Z0-9.\\-]+\\.[A-Z]{2,}$'
       )::int AS reports_without_private_identity,
       count(*) FILTER (
         WHERE (r.status = 'resolved') <> (r.resolved_at IS NOT NULL)
       )::int AS inconsistent_resolution_states
     FROM reports r
     JOIN report_categories c ON c.slug = r.category_slug`,
    [],
  )

  check(integrity.category_scope_mismatches === 0, 'report categories match their scopes')
  check(integrity.negative_vote_counts === 0, 'vote counts are nonnegative')
  check(integrity.publicly_identified_reports === 0, 'all reports are anonymous in public data')
  check(integrity.reports_without_private_identity === 0, 'all reports have private resident identification')
  check(integrity.inconsistent_resolution_states === 0, 'resolved reports have consistent timestamps')

  const [media] = await sql.query(
    `SELECT count(*)::int AS invalid_media
     FROM report_media
     WHERE byte_size < 1
        OR byte_size > 1048576
        OR byte_size <> octet_length(data)
        OR mime_type NOT IN ('image/jpeg', 'image/png', 'image/webp')`,
    [],
  )
  check(media.invalid_media === 0, 'report media respects type and 1 MB limits')

  const indexNames = [
    'reports_public_feed_idx',
    'reports_category_feed_idx',
    'reports_map_idx',
    'report_votes_visitor_idx',
    'report_status_history_report_idx',
    'directory_entries_public_idx',
    'admin_users_email_unique_idx',
    'admin_users_active_idx',
    'rate_limits_expires_at_idx',
  ]
  const indexes = await sql.query(
    `SELECT indexname
     FROM pg_indexes
     WHERE schemaname = 'public'
       AND indexname IN ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    indexNames,
  )
  check(indexes.length === indexNames.length, 'required query indexes exist')

  const [mediaConstraint] = await sql.query(
    `SELECT pg_get_constraintdef(oid) AS definition
     FROM pg_constraint
     WHERE conrelid = 'public.report_media'::regclass
       AND conname = 'report_media_size_valid'`,
    [],
  )
  check(
    Boolean(mediaConstraint?.definition?.includes('1048576')),
    'database enforces the 1 MB media ceiling',
  )

  const identityColumns = await sql.query(
    `SELECT column_name, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'reports'
       AND column_name IN ($1, $2)`,
    ['reporter_name', 'reporter_email'],
  )
  check(
    identityColumns.length === 2 && identityColumns.every((column) => column.is_nullable === 'NO'),
    'database requires private resident name and email',
  )

  const privacyConstraints = await sql.query(
    `SELECT conname
     FROM pg_constraint
     WHERE conrelid = 'public.reports'::regclass
       AND conname IN ($1, $2, $3)`,
    ['reports_always_anonymous', 'reports_reporter_name_length', 'reports_reporter_email_length'],
  )
  check(privacyConstraints.length === 3, 'database enforces report anonymity and private identity constraints')
}

async function main() {
  const [{ database_name: databaseName, server_time: serverTime }] = await sql.query(
    'SELECT current_database() AS database_name, CURRENT_TIMESTAMP AS server_time',
    [],
  )
  console.log(`Connected to ${databaseName} at ${new Date(serverTime).toISOString()}.`)

  await verifyTablesAndColumns()
  await verifySeedData()
  await verifyDevelopmentOwner()
  await verifyIntegrity()

  console.log('Database verification completed successfully.')
}

main().catch((error) => {
  const reason = error instanceof Error ? error.message : String(error)
  console.error(`Database verification failed: ${reason}`)
  process.exitCode = 1
})
