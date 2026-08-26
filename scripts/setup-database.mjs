import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'
import { hashAdminPassword, verifyAdminPassword } from '../lib/password.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '..')
const schemaPath = resolve(projectRoot, 'database', 'schema.sql')
const seedPath = resolve(projectRoot, 'database', 'seed.sql')

const argumentsSet = new Set(process.argv.slice(2))
const schemaOnly = argumentsSet.has('--schema-only')
const seedOnly = argumentsSet.has('--seed-only')

if (schemaOnly && seedOnly) {
  throw new Error('Use either --schema-only or --seed-only, not both.')
}

const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be configured.')
}

if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  throw new Error('The configured database URL is not a PostgreSQL connection string.')
}

const sql = neon(databaseUrl)

function splitStatements(source) {
  return source
    .split(/^\s*--\s*statement-breakpoint\s*$/gim)
    .map((statement) => statement.trim())
    .filter(Boolean)
}

async function executeSqlFile(filePath, label) {
  const source = await readFile(filePath, 'utf8')
  const statements = splitStatements(source)

  console.log(`Applying ${label} (${statements.length} statements)...`)

  for (const [index, statement] of statements.entries()) {
    try {
      // SQL files are trusted project assets. Runtime/user values elsewhere must
      // always use parameters or tagged templates rather than string interpolation.
      await sql.query(statement, [])
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      throw new Error(`${label} failed at statement ${index + 1}: ${reason}`)
    }
  }

  console.log(`${label} applied successfully.`)
}

async function ensureBootstrapAdmin() {
  const [{ count }] = await sql.query(
    'SELECT count(*)::int AS count FROM admin_users',
    [],
  )

  if (Number(count) > 0) {
    console.log('Administrative account already exists; bootstrap credentials were not reapplied.')
    return
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be configured to create the first administrator.',
    )
  }

  const passwordHash = await hashAdminPassword(password)

  await sql.query(
    `INSERT INTO admin_users (email, password_hash, role, must_change_password)
     VALUES ($1, $2, 'owner', true)`,
    [email, passwordHash],
  )

  console.log(`Bootstrap owner created for ${email}. Password change will be required.`)
}

async function ensureDevelopmentOwner() {
  const email = process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.DEV_ADMIN_PASSWORD

  if (!email && !password) {
    console.log('Development owner is not configured; skipping it.')
    return
  }

  if (!email || !password) {
    throw new Error(
      'DEV_ADMIN_EMAIL and DEV_ADMIN_PASSWORD must both be configured to create the development owner.',
    )
  }

  const bootstrapEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()

  if (email === bootstrapEmail) {
    throw new Error('DEV_ADMIN_EMAIL must be different from ADMIN_EMAIL.')
  }

  const rows = await sql.query(
    `SELECT id, email, password_hash, role, active, must_change_password
     FROM admin_users
     WHERE lower(email) = $1
     LIMIT 1`,
    [email],
  )
  const existing = rows[0]

  if (existing) {
    const passwordMatches = await verifyAdminPassword(password, existing.password_hash)

    if (!passwordMatches) {
      throw new Error(
        `Development owner ${email} already exists, but DEV_ADMIN_PASSWORD does not match it.`,
      )
    }

    if (existing.role !== 'owner' || !existing.active || existing.must_change_password) {
      await sql.query(
        `UPDATE admin_users
         SET role = 'owner',
             active = true,
             must_change_password = false,
             session_version = session_version + 1,
             updated_at = now()
         WHERE id = $1`,
        [existing.id],
      )
      console.log(`Development owner ${email} restored with unrestricted owner access.`)
      return
    }

    console.log(`Development owner ${email} already exists and is ready to use.`)
    return
  }

  const passwordHash = await hashAdminPassword(password)

  await sql.query(
    `INSERT INTO admin_users (email, password_hash, role, active, must_change_password)
     VALUES ($1, $2, 'owner', true, false)`,
    [email, passwordHash],
  )

  console.log(`Development owner created for ${email} without a forced account update.`)
}

async function main() {
  if (!seedOnly) {
    await executeSqlFile(schemaPath, 'database/schema.sql')
    await ensureBootstrapAdmin()
    await ensureDevelopmentOwner()
  }

  if (!schemaOnly) {
    await executeSqlFile(seedPath, 'database/seed.sql')
  }

  const [{ now, database_name: databaseName }] = await sql.query(
    'SELECT CURRENT_TIMESTAMP AS now, current_database() AS database_name',
    [],
  )

  console.log(`Database setup complete for ${databaseName} at ${new Date(now).toISOString()}.`)
}

main().catch((error) => {
  const reason = error instanceof Error ? error.message : String(error)
  console.error(`Database setup failed: ${reason}`)
  process.exitCode = 1
})
