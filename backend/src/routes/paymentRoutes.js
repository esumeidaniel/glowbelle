import express from 'express';
import { initializePayment, verifyPayment } from '../controllers/paymentController.js';
import { optionalProtect } from '../middleware/auth.js';

const router = express.Router();

router.post('/initialize', optionalProtect, initializePayment);
router.get('/verify/:reference', verifyPayment);

export default router;
