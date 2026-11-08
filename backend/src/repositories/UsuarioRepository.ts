import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database.js';
import { AppError } from '../errors/AppError.js';

export interface UsuarioRow extends RowDataPacket { id: number; nome: string; email: string; senha: string; cpf: string }
export class UsuarioRepository {
  async findByEmail(email: string): Promise<UsuarioRow | undefined> {
    const [rows] = await pool.execute<UsuarioRow[]>('SELECT id, nome, email, senha, cpf FROM usuarios WHERE email = ?', [email]);
    return rows[0];
  }
  async findPublicById(id: number): Promise<UsuarioRow> {
    const [rows] = await pool.execute<UsuarioRow[]>('SELECT id, nome, email, cpf FROM usuarios WHERE id = ?', [id]);
    if (!rows[0]) throw new AppError(404, 'Usuário não encontrado.', 'NOT_FOUND');
    return rows[0];
  }
  async create(input: { nome: string; email: string; senha: string; cpf: string }): Promise<void> {
    await pool.execute('INSERT INTO usuarios (nome, email, senha, cpf) VALUES (?, ?, ?, ?)', [input.nome, input.email, input.senha, input.cpf]);
  }
  async updateProfile(id: number, input: { nome: string; senha: string; cpf: string }): Promise<void> {
    const [result] = await pool.execute('UPDATE usuarios SET nome = ?, senha = ?, cpf = ? WHERE id = ?', [input.nome, input.senha, input.cpf, id]);
    if ('affectedRows' in result && result.affectedRows === 0) throw new AppError(404, 'Usuário não encontrado.', 'NOT_FOUND');
  }
}
