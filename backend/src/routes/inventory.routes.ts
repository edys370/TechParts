import { Router } from 'express';
import { z } from 'zod';
import { InventoryController } from '../controllers/inventory.controller';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

const movementSchema = z.object({
  productId: z.number().int().positive('ID de producto inválido'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT'], {
    errorMap: () => ({ message: "El tipo debe ser 'IN', 'OUT' o 'ADJUSTMENT'" }),
  }),
  quantity: z.number().int().positive('La cantidad debe ser un entero positivo'),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

router.post('/movements', validateRequest({ body: movementSchema }), InventoryController.registerMovement);
router.get('/movements', InventoryController.getMovements);
router.get('/alerts', InventoryController.getLowStockAlerts);
router.get('/metrics', InventoryController.getDashboardMetrics);

export default router;
