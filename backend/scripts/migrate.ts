import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../src/config/database.js';

async function migrate(): Promise<void> {
  await pool.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(190) NOT NULL PRIMARY KEY,
    checksum CHAR(64) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  const version = '001_initial_schema.sql';
  const source = await readFile(resolve(process.cwd(), '../database/migrations', version), 'utf8');
  const checksum = createHash('sha256').update(source).digest('hex');
  const [applied] = await pool.execute<Array<RowDataPacket & { checksum: string }>>('SELECT checksum FROM schema_migrations WHERE version = ?', [version]);
  if (applied[0]) {
    if (applied[0].checksum !== checksum) throw new Error(`Migration ${version} já foi aplicada com outro conteúdo.`);
    process.stdout.write(`${version}: já aplicada\n`);
    return;
  }

  for (const statement of source.split(/;\s*(?:\r?\n|$)/).map((part) => part.trim()).filter(Boolean)) {
    await pool.query(statement);
  }
  await pool.execute('INSERT INTO schema_migrations (version, checksum) VALUES (?, ?)', [version, checksum]);
  process.stdout.write(`${version}: aplicada\n`);
}

migrate().catch((error: unknown) => {
  process.stderr.write(`Falha ao executar migration: ${error instanceof Error ? error.message : 'erro desconhecido'}\n`);
  process.exitCode = 1;
}).finally(() => { void pool.end(); });
