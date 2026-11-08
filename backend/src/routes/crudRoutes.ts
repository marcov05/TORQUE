import { Router } from 'express';
import { CrudController } from '../controllers/CrudController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function crudRoutes(controller: CrudController): Router {
  const router = Router();
  router.post('/', asyncHandler(controller.create));
  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.get));
  router.put('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.delete));
  return router;
}
