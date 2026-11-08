import type { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService.js';

const service = new DashboardService();
export class DashboardController {
  static async getSummary(_request: Request, response: Response): Promise<void> {
    response.json(await service.getSummary());
  }
}
