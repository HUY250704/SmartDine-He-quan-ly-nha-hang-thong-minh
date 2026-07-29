import express from 'express';
import { getAllOrders, createOrder, getOrdersBySession, updateOrderStatus } from '../controllers/orderController.js';

const router = express.Router();

router.get('/', getAllOrders);
router.post('/', createOrder);
router.get('/session/:id', getOrdersBySession);
router.put('/:id/status', updateOrderStatus);

export default router;
