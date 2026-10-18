import { Router } from 'express';
import { z } from 'zod';
import { SubscriptionController } from '../controllers/subscription.controller';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email('Dirección de correo electrónico inválida'),
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  productId: z.number().int().positive('ID de producto inválido'),
  variantId: z.number().int().positive().optional(),
});

router.post('/', validateRequest({ body: subscribeSchema }), SubscriptionController.subscribe);
router.get('/', SubscriptionController.getAll);

export default router;
