import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError.js';
import { OrdemServicoService } from '../services/OrdemServicoService.js';
import { approvalSchema, orderEditSchema, orderSchema, pageSchema, statusSchema } from '../validators/schemas.js';
import { ordemStatuses } from '../entities/OrdemServico.js';

const service = new OrdemServicoService();
const idSchema = z.coerce.number().int().positive();
const protectedFields = ['status', 'data_conclusao', 'data_abertura', 'created_at', 'updated_at', 'funcionario_responsavel_id', 'historico', 'aprovacoes'];

export class OrdemServicoController {
  static async create(request: Request, response: Response): Promise<void> {
    response.status(201).json(await service.create(orderSchema.parse(request.body), request.user!.id));
  }
  static async list(request: Request, response: Response): Promise<void> {
    const query = pageSchema.parse(request.query);
    const status = z.enum(ordemStatuses).optional().parse(request.query.status);
    response.json(await service.list(query.page, query.limit, query.search, status));
  }
  static async get(request: Request, response: Response): Promise<void> {
    response.json(await service.find(idSchema.parse(request.params.id)));
  }
  static async update(request: Request, response: Response): Promise<void> {
    if (typeof request.body !== 'object' || request.body === null || Array.isArray(request.body)) throw new AppError(400, 'O corpo da requisição deve ser um objeto.', 'INVALID_BODY');
    const body = request.body as Record<string, unknown>;
    const field = protectedFields.find((candidate) => Object.hasOwn(body, candidate));
    if (field) throw new AppError(400, `O campo "${field}" não pode ser alterado nesta operação.`, 'PROTECTED_FIELD');
    response.json(await service.update(idSchema.parse(request.params.id), orderEditSchema.parse(body)));
  }
  static async changeStatus(request: Request, response: Response): Promise<void> {
    response.json(await service.changeStatus(idSchema.parse(request.params.id), statusSchema.parse(request.body).status, request.user!.id));
  }
  static async decideApproval(request: Request, response: Response): Promise<void> {
    const { decisao, observacao } = approvalSchema.parse(request.body);
    response.json(await service.decideApproval(idSchema.parse(request.params.id), decisao, request.user!.id, observacao));
  }
  static async delete(request: Request, _response: Response): Promise<void> {
    await service.remove(idSchema.parse(request.params.id));
  }
}
