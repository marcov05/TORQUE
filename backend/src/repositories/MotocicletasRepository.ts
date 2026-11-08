import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database.js';
import { AppError } from '../errors/AppError.js';
import type { PageInput, PageResult } from './CrudRepository.js';
import { CrudRepository } from './CrudRepository.js';

export interface MotorcycleFilters { marca?: string; modelo?: string; cilindrada_cc?: number; cor?: string; ano?: number; cliente_id?: number }
export class MotocicletasRepository extends CrudRepository {
  constructor() { super(pool, 'motocicletas', ['cliente_id', 'marca', 'modelo', 'ano', 'placa', 'cor', 'cilindrada_cc'], ['marca', 'modelo', 'placa']); }

  async listAdvanced(input: PageInput, filters: MotorcycleFilters): Promise<PageResult<RowDataPacket>> {
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    if (input.search) {
      clauses.push('(m.marca LIKE ? OR m.modelo LIKE ? OR m.placa LIKE ? OR c.nome LIKE ? OR c.cpf LIKE ?)');
      for (let index = 0; index < 5; index += 1) values.push(`%${input.search}%`);
    }
    const mappings: Array<[keyof MotorcycleFilters, string]> = [
      ['marca', 'm.marca'], ['modelo', 'm.modelo'], ['cilindrada_cc', 'm.cilindrada_cc'],
      ['cor', 'm.cor'], ['ano', 'm.ano'], ['cliente_id', 'm.cliente_id'],
    ];
    for (const [key, column] of mappings) {
      const value = filters[key];
      if (value !== undefined && value !== '') { clauses.push(`${column} = ?`); values.push(value); }
    }
    const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    const joins = ' FROM motocicletas m INNER JOIN clientes c ON c.id = m.cliente_id';
    const [countRows] = await pool.execute<(RowDataPacket & { total: number })[]>(`SELECT COUNT(*) AS total${joins}${where}`, values);
    const total = Number(countRows[0]?.total ?? 0);
    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT m.*, c.nome AS proprietario_nome, c.cpf AS proprietario_cpf, c.telefone AS proprietario_telefone, c.email AS proprietario_email${joins}${where} ORDER BY m.id DESC LIMIT ? OFFSET ?`, [...values, input.limit, (input.page - 1) * input.limit]);
    return { data: rows, pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) } };
  }

  async findWithOwner(id: number): Promise<RowDataPacket> {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT m.*, c.nome AS proprietario_nome, c.cpf AS proprietario_cpf, c.telefone AS proprietario_telefone, c.email AS proprietario_email FROM motocicletas m INNER JOIN clientes c ON c.id = m.cliente_id WHERE m.id = ?', [id]);
    if (!rows[0]) throw new AppError(404, 'Motocicleta não encontrada.', 'NOT_FOUND');
    return rows[0];
  }
}
