import { spawnSync } from 'node:child_process';

const safeTestConfiguration = process.env.NODE_ENV === 'test'
  && process.env.MYSQL_DATABASE === 'torque_test'
  && process.env.MYSQL_USER === 'torque_test'
  && process.env.MYSQL_PASSWORD === 'torque_test_only'
  && process.env.MYSQL_HOST === '127.0.0.1'
  && process.env.MYSQL_PORT === '33306';

if (!safeTestConfiguration) {
  process.stderr.write('Integração cancelada: configure exatamente o banco isolado torque_test em 127.0.0.1:33306. Nenhum banco foi acessado.\n');
  process.exit(2);
}

const guard = spawnSync(process.execPath, ['scripts/assert-test-database.mjs'], { stdio: 'inherit', env: process.env });
if (guard.status !== 0) process.exit(guard.status ?? 1);

const migration = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/migrate.ts'], { stdio: 'inherit', env: process.env });
if (migration.status !== 0) process.exit(migration.status ?? 1);

const tests = spawnSync(process.execPath, ['--import', 'tsx', '--test', 'src/tests/integration.test.ts'], { stdio: 'inherit', env: process.env });
process.exit(tests.status ?? 1);
