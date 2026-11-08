import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { UsuarioRepository } from '../repositories/UsuarioRepository.js';

export class AuthService {
  constructor(private readonly users = new UsuarioRepository()) {}

  async register(input: { nome: string; email: string; senha: string; cpf: string }): Promise<void> {
    const hash = await bcrypt.hash(input.senha, env.BCRYPT_ROUNDS);
    await this.users.create({ ...input, senha: hash });
  }

  async login(input: { email: string; senha: string }) {
    const user = await this.users.findByEmail(input.email);
    const valid = user ? await bcrypt.compare(input.senha, user.senha) : (await bcrypt.hash(input.senha, env.BCRYPT_ROUNDS), false);
    if (!user || !valid) throw new AppError(401, 'E-mail ou senha inválidos.', 'INVALID_CREDENTIALS');
    const token = jwt.sign({}, env.JWT_SECRET, { algorithm: 'HS256', subject: String(user.id), expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] });
    return { message: 'Login realizado com sucesso', token, user: { id: user.id, nome: user.nome, email: user.email, cpf: user.cpf } };
  }

  async profile(id: number) {
    const user = await this.users.findPublicById(id);
    return { id: user.id, nome: user.nome, email: user.email, cpf: user.cpf };
  }

  async updateProfile(id: number, input: { nome: string; senha: string; cpf: string }) {
    const senha = await bcrypt.hash(input.senha, env.BCRYPT_ROUNDS);
    await this.users.updateProfile(id, { ...input, senha });
    return this.profile(id);
  }
}
