import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';

export class InventoryController {
  static async registerMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, type, quantity, reason, reference } = req.body;
      const result = await InventoryService.registerMovement({
        productId: Number(productId),
        type,
        quantity: Number(quantity),
        reason,
        reference,
      });

      return res.status(201).json({
        success: true,
        message: 'Movimiento de inventario registrado y auditado correctamente',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, type, limit } = req.query;
      const movements = await InventoryService.getMovements({
        productId: productId ? Number(productId) : undefined,
        type: type ? (type as any) : undefined,
        limit: limit ? Number(limit) : 50,
      });

      return res.json({
        success: true,
        count: movements.length,
        data: movements,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getLowStockAlerts(_req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await InventoryService.getLowStockAlerts();
      return res.json({
        success: true,
        count: alerts.length,
        data: alerts,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getDashboardMetrics(_req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await InventoryService.getDashboardMetrics();
      return res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      return next(error);
    }
  }
}
