import { Router } from 'express';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import inventoryRoutes from './inventory.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/health', healthRoutes);

export default router;
