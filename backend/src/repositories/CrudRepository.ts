import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { AppError } from '../errors/AppError.js';

export interface PageInput { page: number; limit: number; search?: string }
export interface PageResult<T> { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }
export type DbExecutor = Pool | PoolConnection;

export class CrudRepository {
  constructor(
    private readonly db: Pool,
    private readonly table: 'clientes' | 'motocicletas' | 'servicos',
    private readonly columns: readonly string[],
    private readonly searchColumns: readonly string[],
  ) {}

  async list(input: PageInput, filters: Record<string, string | number | boolean | undefined> = {}): Promise<PageResult<RowDataPacket>> {
    const clauses: string[] = [];
    const values: Array<string | number | boolean> = [];
    if (input.search) {
      clauses.push(`(${this.searchColumns.map((column) => `${column} LIKE ?`).join(' OR ')})`);
      for (const _column of this.searchColumns) values.push(`%${input.search}%`);
    }
    for (const [column, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') { clauses.push(`${column} = ?`); values.push(value); }
    }
    const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    const [countRows] = await this.db.execute<(RowDataPacket & { total: number })[]>(`SELECT COUNT(*) AS total FROM ${this.table}${where}`, values);
    const total = Number(countRows[0]?.total ?? 0);
    const offset = (input.page - 1) * input.limit;
    const [rows] = await this.db.execute<RowDataPacket[]>(`SELECT * FROM ${this.table}${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...values, input.limit, offset]);
    return { data: rows, pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) } };
  }

  async find(id: number, executor: DbExecutor = this.db): Promise<RowDataPacket> {
    const [rows] = await executor.execute<RowDataPacket[]>(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
    if (!rows[0]) throw new AppError(404, 'Registro não encontrado.', 'NOT_FOUND');
    return rows[0];
  }

  async create(data: Record<string, unknown>): Promise<number> {
    const keys = Object.keys(data).filter((key) => this.columns.includes(key) && data[key] !== undefined);
    const [result] = await this.db.execute<ResultSetHeader>(`INSERT INTO ${this.table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, keys.map((key) => data[key] as string | number | boolean | null));
    return result.insertId;
  }

  async update(id: number, data: Record<string, unknown>): Promise<void> {
    const keys = Object.keys(data).filter((key) => this.columns.includes(key) && data[key] !== undefined);
    if (keys.length === 0) throw new AppError(400, 'Nenhum campo autorizado para alteração.', 'EMPTY_UPDATE');
    const [result] = await this.db.execute<ResultSetHeader>(`UPDATE ${this.table} SET ${keys.map((key) => `${key} = ?`).join(', ')} WHERE id = ?`, [...keys.map((key) => data[key] as string | number | boolean | null), id]);
    if (result.affectedRows === 0) await this.find(id);
  }

  async delete(id: number): Promise<void> {
    const [result] = await this.db.execute<ResultSetHeader>(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
    if (result.affectedRows === 0) await this.find(id);
  }
}
