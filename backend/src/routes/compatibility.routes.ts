import { Router } from 'express';
import { z } from 'zod';
import { CompatibilityController } from '../controllers/compatibility.controller';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

const compatibilityCheckSchema = z.object({
  productIds: z.array(z.number().int().positive()).optional(),
  items: z.array(z.union([z.number().int().positive(), z.object({ id: z.number() })])).optional(),
  cpuId: z.number().int().positive().optional(),
  motherboardId: z.number().int().positive().optional(),
  ramId: z.number().int().positive().optional(),
  gpuId: z.number().int().positive().optional(),
  psuId: z.number().int().positive().optional(),
  customSpecs: z
    .array(
      z.object({
        name: z.string().optional(),
        category: z.string().optional(),
        socket: z.string().optional(),
        memoryType: z.enum(['DDR4', 'DDR5']).optional(),
        tdpWatts: z.number().optional(),
        tgpWatts: z.number().optional(),
        wattage: z.number().optional(),
        recommendedPsuWatts: z.number().optional(),
      })
    )
    .optional(),
});

router.post('/check', validateRequest({ body: compatibilityCheckSchema }), CompatibilityController.check);
router.get('/guidelines', CompatibilityController.getGuidelines);

export default router;
