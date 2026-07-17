import express from 'express';
import { overview, revenue, recentOrders } from '../controllers/dashboardController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', auth, overview);
router.get('/revenue', auth, revenue);
router.get('/recent-orders', auth, recentOrders);

export default router;