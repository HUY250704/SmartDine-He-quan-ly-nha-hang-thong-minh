import express from 'express';
import { getBills, getBillById, generateBill, getRevenueStats } from '../controllers/billController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Admin-only routes
router.get('/', auth, getBills);
router.get('/stats/revenue', auth, getRevenueStats);
router.get('/:id', auth, getBillById);

// Admin-only payment confirmation
router.post('/generate', auth, generateBill);

export default router;