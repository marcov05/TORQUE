import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.get('/', asyncHandler(DashboardController.getSummary));
export default router;
