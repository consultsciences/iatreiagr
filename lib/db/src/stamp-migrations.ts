/**
 * stamp-migrations.ts
 *
 * Use this on an existing database that was set up via `drizzle-kit push`
 * (before migration tracking was introduced). It records all pending
 * migration files as already applied so that `migrate` won't try to
 * re-run them.
 *
 * On a fresh database you do NOT need this — just run `migrate` directly.
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, "../migrations");
const journalPath = path.join(migrationsFolder, "meta/_journal.json");

type JournalEntry = { idx: number; when: number; tag: string };
type Journal = { entries: JournalEntry[] };

function hashSql(sql: string): string {
  return crypto.createHash("sha256").update(sql).digest("hex");
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT
    )
  `);

  const journal: Journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));

  for (const entry of journal.entries) {
    const sqlPath = path.join(migrationsFolder, `${entry.tag}.sql`);
    const sqlContent = fs.readFileSync(sqlPath, "utf8");
    const hash = hashSql(sqlContent);

    const existing = await pool.query(
      `SELECT id FROM drizzle."__drizzle_migrations" WHERE created_at = $1`,
      [entry.when],
    );

    if (existing.rows.length > 0) {
      console.log(`  Already stamped: ${entry.tag}`);
    } else {
      await pool.query(
        `INSERT INTO drizzle."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`,
        [hash, entry.when],
      );
      console.log(`  Stamped: ${entry.tag} (folderMillis=${entry.when})`);
    }
  }

  console.log("Stamp complete — existing database is now tracked by migrate.");
  await pool.end();
}

main().catch((err) => {
  console.error("Stamp failed:", err);
  process.exit(1);
});
