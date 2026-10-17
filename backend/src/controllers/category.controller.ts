import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';

export class CategoryController {
  static async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.getAll();
      return res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Categoría creada con éxito',
        data: category,
      });
    } catch (error) {
      return next(error);
    }
  }
}
