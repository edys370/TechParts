import { Router } from 'express';
import { z } from 'zod';
import { InventoryController } from '../controllers/inventory.controller';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

const movementSchema = z.object({
  productId: z.number().int().positive('ID de producto inválido'),
  variantId: z.number().int().positive().optional(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT'], {
    errorMap: () => ({ message: "El tipo debe ser 'IN', 'OUT' o 'ADJUSTMENT'" }),
  }),
  quantity: z.number().int().positive('La cantidad debe ser un entero positivo'),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

const concurrencyTestSchema = z.object({
  productId: z.number().int().positive().optional(),
  variantId: z.number().int().positive().optional(),
  concurrentRequests: z.number().int().min(1).max(100).optional(),
  quantityPerRequest: z.number().int().min(1).optional(),
});

const rollbackTestSchema = z.object({
  productId: z.number().int().positive().optional(),
});

router.post('/movements', validateRequest({ body: movementSchema }), InventoryController.registerMovement);
router.get('/movements', InventoryController.getMovements);
router.get('/alerts', InventoryController.getLowStockAlerts);
router.get('/metrics', InventoryController.getDashboardMetrics);

// Rutas de Pruebas ACID (Fase 4 - Dev 1)
router.post('/test-concurrency', validateRequest({ body: concurrencyTestSchema }), InventoryController.testConcurrency);
router.post('/test-rollback', validateRequest({ body: rollbackTestSchema }), InventoryController.testRollback);

export default router;
