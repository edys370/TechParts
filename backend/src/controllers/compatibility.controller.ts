import { Request, Response, NextFunction } from 'express';
import { CompatibilityService } from '../services/compatibility.service';

export class CompatibilityController {
  static async check(req: Request, res: Response, next: NextFunction) {
    try {
      const { productIds } = req.body;
      const result = await CompatibilityService.checkCompatibility(productIds || []);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
