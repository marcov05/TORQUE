import { z } from 'zod';
import { isValidCpf } from './format';

export const emailField = z.string().trim().email('Informe um e-mail válido.').max(254, 'O e-mail é muito longo.');
export const passwordField = z.string().min(8, 'Use ao menos 8 caracteres.').max(72, 'A senha pode ter até 72 caracteres.')
  .regex(/[A-Z]/, 'Inclua uma letra maiúscula.')
  .regex(/[a-z]/, 'Inclua uma letra minúscula.')
  .regex(/[0-9]/, 'Inclua um número.')
  .regex(/[^A-Za-z0-9]/, 'Inclua um caractere especial.');
export const cpfField = z.string().refine(isValidCpf, 'Informe um CPF válido.');

export const loginFormSchema = z.object({ email: emailField, senha: z.string().min(1, 'Informe sua senha.') });
export const registerFormSchema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome.').max(160),
  email: emailField,
  cpf: cpfField,
  senha: passwordField,
  confirmarSenha: z.string().min(1, 'Confirme sua senha.'),
}).refine((value) => value.senha === value.confirmarSenha, { path: ['confirmarSenha'], message: 'As senhas não coincidem.' });
export const profileFormSchema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome.').max(160),
  cpf: cpfField,
  senha: passwordField,
  confirmarSenha: z.string().min(1, 'Confirme sua senha.'),
}).refine((value) => value.senha === value.confirmarSenha, { path: ['confirmarSenha'], message: 'As senhas não coincidem.' });

export const customerFormSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome.').max(160),
  cpf: cpfField,
  telefone: z.string().trim().min(8, 'Informe um telefone válido.').max(24),
  email: z.union([z.string().trim().email('Informe um e-mail válido.').max(254), z.literal('')]).optional(),
});
export const motorcycleFormSchema = z.object({
  cliente_id: z.coerce.number().int().positive('Selecione o proprietário.'),
  marca: z.string().trim().min(1, 'Informe a marca.').max(100),
  modelo: z.string().trim().min(1, 'Informe o modelo.').max(120),
  ano: z.coerce.number().int().min(1885, 'Ano inválido.').max(new Date().getFullYear() + 1, 'Ano inválido.'),
  placa: z.string().trim().toUpperCase().regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, 'Informe uma placa válida.'),
  cor: z.string().trim().max(60).optional(),
  cilindrada_cc: z.coerce.number().int().positive('A cilindrada deve ser maior que zero.'),
});
export const serviceFormSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(160),
  descricao: z.string().trim().min(1, 'Informe a descrição.').max(10000),
  preco: z.coerce.number().positive('O preço deve ser maior que zero.'),
  duracao_estimada: z.coerce.number().int().positive('A duração deve ser maior que zero.').max(65535),
  ativo: z.boolean().optional(),
});
export const workOrderFormSchema = z.object({
  motocicleta_id: z.coerce.number().int().positive('Selecione uma motocicleta.'),
  descricao: z.string().trim().min(1, 'Descreva o atendimento.').max(10000),
  itens: z.array(z.object({
    servico_id: z.coerce.number().int().positive('Selecione um serviço.'),
    quantidade: z.coerce.number().int().positive('A quantidade deve ser maior que zero.').max(1000),
  })).min(1, 'Adicione pelo menos um serviço.'),
});
