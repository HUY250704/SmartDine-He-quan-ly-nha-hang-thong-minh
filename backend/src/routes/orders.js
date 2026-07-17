import express from 'express';
import { createOrder, getOrdersBySession, updateOrderStatus } from '../controllers/orderController.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/session/:id', getOrdersBySession);
router.put('/:id/status', updateOrderStatus);

export default router;