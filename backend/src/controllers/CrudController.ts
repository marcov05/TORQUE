import type { Request, Response } from 'express';
import { z, type ZodType } from 'zod';
import { AppError } from '../errors/AppError.js';
import { CrudService } from '../services/CrudService.js';
import { pageSchema } from '../validators/schemas.js';

export class CrudController {
  constructor(private readonly service: CrudService, private readonly schema: ZodType, private readonly resource: string) {}

  list = async (request: Request, response: Response): Promise<void> => {
    const query = pageSchema.parse(request.query);
    response.json(await this.service.list({ page: query.page, limit: query.limit, search: query.search }));
  };
  get = async (request: Request, response: Response): Promise<void> => {
    response.json(await this.service.get(z.coerce.number().int().positive().parse(request.params.id)));
  };
  create = async (request: Request, response: Response): Promise<void> => {
    const data: unknown = this.schema.parse(request.body);
    response.status(201).json(await this.service.create(data as Record<string, unknown>));
  };
  update = async (request: Request, response: Response): Promise<void> => {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const data: unknown = this.schema.parse(request.body);
    response.json(await this.service.update(id, data as Record<string, unknown>));
  };
  delete = async (request: Request, response: Response): Promise<void> => {
    await this.service.delete(z.coerce.number().int().positive().parse(request.params.id));
    if (this.resource === 'serviços') response.json({ message: 'Serviço desativado.' });
    else response.status(204).send();
  };
}

export function rejectProtectedFields(value: Record<string, unknown>, fields: string[]): void {
  const protectedField = fields.find((field) => Object.hasOwn(value, field));
  if (protectedField) throw new AppError(400, `O campo "${protectedField}" não pode ser alterado nesta operação.`, 'PROTECTED_FIELD');
}
