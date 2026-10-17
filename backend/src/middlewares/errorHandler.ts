import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('❌ Error capturado:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación de datos',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Errores de Prisma
  if (err?.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Conflicto: ya existe un registro con ese valor único (ej. SKU o nombre)',
      fields: err.meta?.target,
    });
  }

  if (err?.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Recurso no encontrado en la base de datos',
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
}
