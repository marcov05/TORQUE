import mysql from 'mysql2/promise';

const safeTestConfiguration = process.env.NODE_ENV === 'test'
  && process.env.MYSQL_DATABASE === 'torque_test'
  && process.env.MYSQL_USER === 'torque_test'
  && process.env.MYSQL_PASSWORD === 'torque_test_only'
  && process.env.MYSQL_HOST === '127.0.0.1'
  && process.env.MYSQL_PORT === '33306';

if (!safeTestConfiguration) {
  process.stderr.write('Database refused: configuration does not identify the isolated test container.\n');
  process.exit(2);
}

let lastError = new Error('no response from database');
for (let attempt = 1; attempt <= 30; attempt += 1) {
  let connection;
  let identity;
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1', port: 33306, database: 'torque_test', user: 'torque_test', password: 'torque_test_only',
      connectTimeout: 3000,
    });
    const [rows] = await connection.query('SELECT DATABASE() AS database_name, @@hostname AS hostname, @@version AS server_version');
    identity = rows[0];
  } catch (error) {
    lastError = error instanceof Error ? error : new Error('unknown connection error');
  } finally {
    if (connection) await connection.end().catch(() => undefined);
  }

  if (identity) {
    if (identity.database_name !== 'torque_test' || identity.hostname !== 'torque-mysql-test' || !String(identity.server_version).startsWith('8.')) {
      process.stderr.write(`Unexpected database identity: ${identity.database_name}, ${identity.server_version}, ${identity.hostname}.\n`);
      process.exit(2);
    }
    process.stdout.write(`Isolated database confirmed: ${identity.database_name}, MySQL ${identity.server_version}, ${identity.hostname}.\n`);
    process.exit(0);
  }

  if (attempt < 30) await new Promise((resolve) => setTimeout(resolve, 1000));
}

process.stderr.write(`Test database unavailable after 30 attempts: ${lastError.message}\n`);
process.exitCode = 1;
