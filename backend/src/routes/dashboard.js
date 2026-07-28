import express from 'express';
import { overview, getStats, revenue, getTopItems, recentOrders } from '../controllers/dashboardController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', auth, overview);
router.get('/stats', auth, getStats);
router.get('/revenue', auth, revenue);
router.get('/top-items', auth, getTopItems);
router.get('/recent-orders', auth, recentOrders);

export default router;