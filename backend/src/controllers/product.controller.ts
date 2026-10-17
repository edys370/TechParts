import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';

export class ProductController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, categoryId, brand, status, page, limit } = req.query;
      const result = await ProductService.getAll({
        search: search ? String(search) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        brand: brand ? String(brand) : undefined,
        status: status ? String(status) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
      });

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const product = await ProductService.getById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Producto con ID ${id} no encontrado`,
        });
      }

      return res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: product,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const updated = await ProductService.update(id, req.body);
      return res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await ProductService.delete(id);
      return res.json({
        success: true,
        message: 'Producto eliminado correctamente',
      });
    } catch (error) {
      return next(error);
    }
  }
}
