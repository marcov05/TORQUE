import mysql, { type Pool, type PoolConnection } from 'mysql2/promise';
import { env } from './env.js';

export const pool: Pool = mysql.createPool({
  host: env.MYSQL_HOST,
  port: env.MYSQL_PORT,
  database: env.MYSQL_DATABASE,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  decimalNumbers: true,
  timezone: 'Z',
});

export async function inTransaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
