import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service';

export class SubscriptionController {
  static async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SubscriptionService.subscribe(req.body);
      res.status(201).json({
        success: true,
        message: result.message,
        data: result.subscription,
        alreadySubscribed: result.alreadySubscribed,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, limit } = req.query;
      const subscriptions = await SubscriptionService.getAllSubscriptions({
        status: status as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      res.json({
        success: true,
        total: subscriptions.length,
        data: subscriptions,
      });
    } catch (error) {
      next(error);
    }
  }
}
