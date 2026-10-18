import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';

const router = Router();

router.get('/', EmailController.getLogs);
router.post('/test', EmailController.sendTest);

export default router;
