import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';

export class OrderController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrderService.createOrder(req.body);
      res.status(201).json({
        success: true,
        message: 'Pedido registrado satisfactoriamente',
        data: result.order,
        paymentInstructions: result.paymentInstructions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status, page, limit } = req.query;
      const result = await OrderService.getAllOrders({
        search: search as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado',
        });
      }
      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getShippingZones(_req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await OrderService.getShippingZones();
      res.json({
        success: true,
        data: zones,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentMethods(_req: Request, res: Response, next: NextFunction) {
    try {
      const methods = OrderService.getPaymentMethods();
      res.json({
        success: true,
        data: methods,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, paymentStatus } = req.body;
      const order = await OrderService.updateOrderStatus(Number(id), status, paymentStatus);
      res.json({
        success: true,
        message: 'Estado de pedido actualizado',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}
