// Runner de tests pgTAP contra una base Postgres/Supabase, sin Docker ni psql.
//
// Uso:
//   DATABASE_URL="postgresql://postgres:<pwd>@<host>:5432/postgres" \
//     node tests/db/run-pgtap.mjs
//
// Cada archivo .sql de supabase/tests/ se ejecuta en su propia transacción
// (BEGIN … ROLLBACK) para no dejar datos de prueba en la base. El runner
// recolecta la salida TAP de las funciones pgTAP y falla si hay algún "not ok".

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = path.resolve(__dirname, '../../supabase/tests');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: falta la variable de entorno DATABASE_URL.');
  process.exit(2);
}

const TAP_LINE = /^(ok |not ok |\d+\.\.\d+)/;

function extractTapLines(results) {
  const arr = Array.isArray(results) ? results : [results];
  const lines = [];
  for (const res of arr) {
    for (const row of res?.rows ?? []) {
      const value = Object.values(row)[0];
      if (typeof value !== 'string') continue;
      for (const line of value.split('\n')) {
        if (TAP_LINE.test(line.trim())) lines.push(line.trim());
      }
    }
  }
  return lines;
}

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // pgTAP es dependencia de test, no del esquema de producción.
  await client.query('create extension if not exists pgtap');

  const files = (await readdir(TESTS_DIR)).filter((f) => f.endsWith('.sql')).sort();

  let failures = 0;
  let assertions = 0;

  for (const file of files) {
    const sql = await readFile(path.join(TESTS_DIR, file), 'utf8');
    let lines = [];
    try {
      await client.query('begin');
      const results = await client.query(sql);
      lines = extractTapLines(results);
      await client.query('rollback');
    } catch (err) {
      await client.query('rollback').catch(() => {});
      console.error(`\n✗ ${file} — error ejecutando el archivo:`);
      console.error(`  ${err.message}`);
      failures += 1;
      continue;
    }

    const fileFailures = lines.filter((l) => l.startsWith('not ok'));
    const fileOks = lines.filter((l) => l.startsWith('ok '));
    assertions += fileOks.length + fileFailures.length;

    if (fileFailures.length > 0) {
      failures += fileFailures.length;
      console.error(`\n✗ ${file} — ${fileFailures.length} fallo(s):`);
      for (const l of lines) console.error(`  ${l}`);
    } else {
      console.log(`✓ ${file} — ${fileOks.length} assertion(s) ok`);
    }
  }

  await client.end();

  console.log(`\n${assertions} assertions, ${failures} fallo(s).`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
