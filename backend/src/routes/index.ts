import { Router } from 'express';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import inventoryRoutes from './inventory.routes';
import orderRoutes from './order.routes';
import compatibilityRoutes from './compatibility.routes';
import subscriptionRoutes from './subscription.routes';
import emailRoutes from './email.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/compatibility', compatibilityRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/email-logs', emailRoutes);
router.use('/health', healthRoutes);

export default router;
