import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (error instanceof ZodError) {
    response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: error.flatten().fieldErrors } });
    return;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String(error.code);
    if (code === 'ER_DUP_ENTRY') {
      response.status(409).json({ error: { code: 'DUPLICATE_ENTRY', message: 'Já existe um registro com esses dados únicos.' } });
      return;
    }
    if (code === 'ER_NO_REFERENCED_ROW_2') {
      response.status(409).json({ error: { code: 'RELATED_RESOURCE_NOT_FOUND', message: 'Um dos registros vinculados não existe.' } });
      return;
    }
    if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED') {
      response.status(409).json({ error: { code: 'RESOURCE_IN_USE', message: 'Este registro possui vínculos e não pode ser excluído.' } });
      return;
    }
  }
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    response.status(400).json({ error: { code: 'INVALID_JSON', message: 'O corpo da requisição contém JSON inválido.' } });
    return;
  }
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro interno.' } });
};
