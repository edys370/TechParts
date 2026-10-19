import { Router } from 'express';
import { z } from 'zod';
import { EmailController } from '../controllers/email.controller';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

const orderItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  variantName: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
});

const invoicePayloadSchema = z.object({
  orderNumber: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email('Correo electrónico no válido'),
  customerPhone: z.string().optional(),
  shippingAddress: z.string().min(1),
  shippingCity: z.string().min(1),
  shippingZone: z.string().min(1),
  shippingCost: z.number().nonnegative(),
  paymentMethod: z.enum(['TRANSFERENCIA_BANCARIA', 'CONTRA_ENTREGA', 'PASARELA_SANDBOX']),
  items: z.array(orderItemSchema).min(1, 'La orden debe contener al menos 1 artículo'),
  subtotal: z.number().positive(),
  tax: z.number().nonnegative(),
  total: z.number().positive(),
  orderDate: z.string().optional(),
});

router.get('/verify', EmailController.verify);
router.post('/send-invoice', validateRequest({ body: invoicePayloadSchema }), EmailController.sendInvoice);
router.post('/notify-admin', validateRequest({ body: invoicePayloadSchema }), EmailController.notifyAdmin);
router.post('/test-invoice', EmailController.sendTestInvoice);

export default router;
