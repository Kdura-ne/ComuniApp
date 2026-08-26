import "server-only";

import { neon } from "@neondatabase/serverless";

let client;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não foi configurada.");
  }

  if (!client) {
    client = neon(process.env.DATABASE_URL, {
      fetchOptions: { cache: "no-store" },
    });
  }

  return client;
}

export async function checkDatabaseConnection() {
  const sql = getSql();
  const [result] = await sql`select current_database() as database, now() as checked_at`;
  return result;
}
