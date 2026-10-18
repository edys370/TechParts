import { Router } from 'express';
import { z } from 'zod';
import { CompatibilityController } from '../controllers/compatibility.controller';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

const checkSchema = z.object({
  productIds: z.array(z.number().int().positive()).min(1, 'Debes enviar al menos un ID de producto'),
});

router.post('/check', validateRequest({ body: checkSchema }), CompatibilityController.check);

export default router;
