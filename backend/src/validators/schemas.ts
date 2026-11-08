import { z } from 'zod';
import { isValidCpf, normalizeCpf } from '../utils/cpf.js';
import { ordemStatuses } from '../entities/OrdemServico.js';

const cpf = z.string().transform(normalizeCpf).refine(isValidCpf, 'CPF inválido.');
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string().min(8).max(72).regex(/[A-Z]/, 'Inclua uma letra maiúscula.').regex(/[a-z]/, 'Inclua uma letra minúscula.').regex(/[0-9]/, 'Inclua um número.').regex(/[^A-Za-z0-9]/, 'Inclua um caractere especial.');
export const registerSchema = z.object({ nome: z.string().trim().min(2).max(160), email, senha: password, cpf }).strict();
export const loginSchema = z.object({ email, senha: z.string().min(1).max(72) }).strict();
export const profileSchema = z.object({ nome: z.string().trim().min(2).max(160), cpf, senha: password }).strict();
export const clientSchema = z.object({ nome: z.string().trim().min(2).max(160), cpf, telefone: z.string().trim().min(8).max(24), email: email.nullable().optional().or(z.literal('')) }).strict().transform((value) => ({ ...value, email: value.email || null }));
export const motorcycleSchema = z.object({ cliente_id: z.number().int().positive(), marca: z.string().trim().min(1).max(100), modelo: z.string().trim().min(1).max(120), ano: z.number().int().min(1885).max(new Date().getFullYear() + 1), placa: z.string().trim().toUpperCase().regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/), cor: z.string().trim().max(60).nullable().optional(), cilindrada_cc: z.number().int().positive() }).strict();
export const serviceSchema = z.object({ nome: z.string().trim().min(1).max(160), descricao: z.string().trim().min(1).max(10000), preco: z.number().positive().max(9999999999.99), duracao_estimada: z.number().int().positive().max(65535), ativo: z.boolean().optional() }).strict();
export const orderSchema = z.object({ motocicleta_id: z.number().int().positive(), descricao: z.string().trim().min(1).max(10000), itens: z.array(z.object({ servico_id: z.number().int().positive(), quantidade: z.number().int().positive().max(1000) }).strict()).min(1).max(100) }).strict();
export const orderEditSchema = orderSchema;
export const statusSchema = z.object({ status: z.enum(ordemStatuses) }).strict();
export const approvalSchema = z.object({ decisao: z.enum(['APROVADA', 'REJEITADA']), observacao: z.string().trim().max(1000).optional() }).strict();
export const idSchema = z.coerce.number().int().positive();
export const pageSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(10), search: z.string().trim().max(200).optional() }).passthrough();
