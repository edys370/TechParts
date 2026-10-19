import { Router } from 'express';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import inventoryRoutes from './inventory.routes';
import healthRoutes from './health.routes';
import compatibilityRoutes from './compatibility.routes';

const router = Router();

router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/health', healthRoutes);
router.use('/compatibility', compatibilityRoutes);

export default router;
