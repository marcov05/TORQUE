import { Router } from 'express';
import { z } from 'zod';
import { CrudController } from '../controllers/CrudController.js';
import { motocicletasRepository } from '../repositories/Repositories.js';
import { MotocicletasRepository } from '../repositories/MotocicletasRepository.js';
import { CrudService } from '../services/CrudService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { motorcycleSchema, pageSchema } from '../validators/schemas.js';

const router = Router();
const base = new CrudController(new CrudService(motocicletasRepository, 'motocicletas'), motorcycleSchema, 'motocicletas');
const repository = new MotocicletasRepository();
router.post('/', asyncHandler(base.create));
router.get('/', asyncHandler(async (request, response) => {
  const query = pageSchema.parse(request.query);
  const filters = z.object({ marca: z.string().trim().max(100).optional(), modelo: z.string().trim().max(120).optional(), cilindrada_cc: z.coerce.number().int().positive().optional(), cor: z.string().trim().max(60).optional(), ano: z.coerce.number().int().min(1885).max(2100).optional(), cliente_id: z.coerce.number().int().positive().optional() }).parse(request.query);
  response.json(await repository.listAdvanced({ page: query.page, limit: query.limit, search: query.search }, filters));
}));
router.get('/:id', asyncHandler(async (request, response) => response.json(await repository.findWithOwner(z.coerce.number().int().positive().parse(request.params.id)))));
router.put('/:id', asyncHandler(base.update));
router.delete('/:id', asyncHandler(base.delete));
export default router;
