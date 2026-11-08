import type { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { loginSchema, profileSchema, registerSchema } from '../validators/schemas.js';

const service = new AuthService();
export class AuthController {
  static async register(request: Request, response: Response): Promise<void> {
    await service.register(registerSchema.parse(request.body));
    response.status(201).json({ message: 'Cadastro realizado com sucesso. Faça login para continuar.' });
  }
  static async login(request: Request, response: Response): Promise<void> {
    response.json(await service.login(loginSchema.parse(request.body)));
  }
  static async profile(request: Request, response: Response): Promise<void> {
    response.json(await service.profile(request.user!.id));
  }
  static async updateProfile(request: Request, response: Response): Promise<void> {
    response.json(await service.updateProfile(request.user!.id, profileSchema.parse(request.body)));
  }
}
