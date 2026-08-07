import express from 'express';
import { getAllOrders, createOrder, getOrdersBySession, updateOrderStatus } from '../controllers/orderController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getAllOrders);
router.post('/', createOrder);
router.get('/session/:id', getOrdersBySession);
router.put('/:id/status', auth, updateOrderStatus);

export default router;
