import { Router } from 'express';
import { z } from 'zod';
import { CrudController } from '../controllers/CrudController.js';
import { servicosRepository } from '../repositories/Repositories.js';
import { CrudService } from '../services/CrudService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pageSchema, serviceSchema } from '../validators/schemas.js';

const router = Router();
const controller = new CrudController(new CrudService(servicosRepository, 'servicos'), serviceSchema, 'serviços');
router.post('/', asyncHandler(controller.create));
router.get('/', asyncHandler(async (request, response) => {
  const page = pageSchema.parse(request.query);
  const activeValue = z.enum(['true', 'false']).optional().parse(request.query.ativo);
  response.json(await servicosRepository.list(
    { page: page.page, limit: page.limit, search: page.search },
    { ativo: activeValue === undefined ? undefined : activeValue === 'true' },
  ));
}));
router.get('/:id', asyncHandler(controller.get));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.delete));
export default router;
