import { Router } from 'express';
import { OrdemServicoController } from '../controllers/OrdemServicoController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.post('/', asyncHandler(OrdemServicoController.create));
router.get('/', asyncHandler(OrdemServicoController.list));
router.get('/:id', asyncHandler(OrdemServicoController.get));
router.put('/:id', asyncHandler(OrdemServicoController.update));
router.patch('/:id/status', asyncHandler(OrdemServicoController.changeStatus));
router.patch('/:id/aprovacao', asyncHandler(OrdemServicoController.decideApproval));
router.delete('/:id', asyncHandler(OrdemServicoController.delete));
export default router;
