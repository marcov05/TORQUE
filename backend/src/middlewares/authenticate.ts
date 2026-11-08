import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';

export const authenticate: RequestHandler = (request, _response, next) => {
  const header = request.header('authorization');
  if (!header?.startsWith('Bearer ')) return next(new AppError(401, 'Autenticação necessária.', 'UNAUTHENTICATED'));
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
    const id = Number(payload.sub);
    if (!Number.isSafeInteger(id) || id < 1) throw new Error('Invalid subject');
    request.user = { id };
    next();
  } catch {
    next(new AppError(401, 'Token inválido ou expirado.', 'INVALID_TOKEN'));
  }
};
