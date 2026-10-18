import { Router } from 'express';
import { z } from 'zod';
import { OrderController } from '../controllers/order.controller';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

const createOrderSchema = z.object({
  customerName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  customerEmail: z.string().email('Correo electrónico no válido'),
  customerPhone: z.string().min(7, 'Número telefónico inválido'),
  customerAddress: z.string().min(5, 'Dirección de entrega requerida'),
  customerCity: z.string().min(2, 'Ciudad o provincia requerida'),
  customerCedula: z.string().optional(),
  shippingZoneId: z.number().int().positive('Zona de envío requerida'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH_ON_DELIVERY', 'SANDBOX_CARD'], {
    errorMap: () => ({ message: 'Método de pago no reconocido' }),
  }),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number().int().positive('ID de producto inválido'),
      variantId: z.number().int().positive().optional(),
      quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
    })
  ).min(1, 'El pedido debe contener al menos un artículo'),
});

router.post('/', validateRequest({ body: createOrderSchema }), OrderController.create);
router.get('/', OrderController.getAll);
router.get('/shipping-zones', OrderController.getShippingZones);
router.get('/payment-methods', OrderController.getPaymentMethods);
router.get('/:id', OrderController.getById);
router.patch('/:id/status', OrderController.updateStatus);

export default router;
