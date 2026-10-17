import { Router } from 'express';
import { z } from 'zod';
import { CategoryController } from '../controllers/category.controller';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

const createCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().optional(),
  description: z.string().optional(),
});

router.get('/', CategoryController.list);
router.post('/', validateRequest({ body: createCategorySchema }), CategoryController.create);

export default router;
