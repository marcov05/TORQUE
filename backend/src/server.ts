import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/database.js';

const server = app.listen(env.API_PORT, () => process.stdout.write(`TORQUE API listening on port ${env.API_PORT}\n`));
const shutdown = (): void => {
  server.close(() => { void pool.end().finally(() => process.exit(0)); });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
