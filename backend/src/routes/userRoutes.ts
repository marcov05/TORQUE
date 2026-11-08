import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);
router.get('/me', asyncHandler(AuthController.profile));
router.put('/me', asyncHandler(AuthController.updateProfile));
export default router;
