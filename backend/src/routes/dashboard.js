import express from 'express';
import { overview, getStats, revenue, revenueChart, getTopItems, recentOrders } from '../controllers/dashboardController.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', auth, overview);
router.get('/stats', auth, isAdmin, getStats);
router.get('/revenue', auth, isAdmin, revenue);
router.get('/revenue-chart', auth, isAdmin, revenueChart);
router.get('/top-items', auth, isAdmin, getTopItems);
router.get('/recent-orders', auth, recentOrders);

export default router;
