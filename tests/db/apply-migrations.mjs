// Aplica las migraciones de supabase/migrations/ a la base apuntada por
// DATABASE_URL, registrando cada versión en supabase_migrations.schema_migrations
// (misma bookkeeping que `supabase db push`, para que un push nativo posterior
// las reconozca como ya aplicadas). Lee la credencial de process.env — no la
// expone en la línea de comando.
//
// Uso:  DATABASE_URL=... node tests/db/apply-migrations.mjs

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../../supabase/migrations');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: falta DATABASE_URL.');
  process.exit(2);
}

async function main() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  await client.query('create schema if not exists supabase_migrations');
  await client.query(`
    create table if not exists supabase_migrations.schema_migrations (
      version text primary key,
      name text,
      statements text[]
    )`);

  const applied = new Set(
    (await client.query('select version from supabase_migrations.schema_migrations')).rows.map(
      (r) => r.version,
    ),
  );

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const version = file.split('_')[0];
    const name = file.replace(/^\d+_/, '').replace(/\.sql$/, '');
    if (applied.has(version)) {
      console.log(`= ${file} (ya aplicada)`);
      continue;
    }
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query(
        'insert into supabase_migrations.schema_migrations (version, name, statements) values ($1, $2, $3)',
        [version, name, [sql]],
      );
      await client.query('commit');
      console.log(`✓ ${file} aplicada`);
    } catch (err) {
      await client.query('rollback').catch(() => {});
      console.error(`✗ ${file} — ${err.message}`);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('Migraciones aplicadas.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
