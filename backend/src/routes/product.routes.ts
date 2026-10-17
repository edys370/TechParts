import { Router } from 'express';
import { z } from 'zod';
import { ProductController } from '../controllers/product.controller';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

const createProductSchema = z.object({
  sku: z.string().min(3, 'El SKU debe tener al menos 3 caracteres'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  brand: z.string().min(1, 'La marca es requerida'),
  model: z.string().min(1, 'El modelo es requerido'),
  price: z.number().positive('El precio debe ser positivo'),
  costPrice: z.number().positive('El costo debe ser positivo'),
  stock: z.number().int().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
  description: z.string().optional(),
  categoryId: z.number().int().positive('ID de categoría inválido'),
});

const updateProductSchema = createProductSchema.partial();

router.get('/', ProductController.list);
router.get('/:id', ProductController.getById);
router.post('/', validateRequest({ body: createProductSchema }), ProductController.create);
router.put('/:id', validateRequest({ body: updateProductSchema }), ProductController.update);
router.delete('/:id', ProductController.delete);

export default router;
