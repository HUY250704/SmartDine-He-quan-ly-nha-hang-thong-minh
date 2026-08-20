import express from 'express';
import { getBills, getBillById, generateBill, getRevenueStats } from '../controllers/billController.js';
import { createPaymentIntent, confirmStripePayment } from '../controllers/stripeController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Admin-only routes
router.get('/', auth, getBills);
router.get('/stats/revenue', auth, getRevenueStats);
router.get('/:id', auth, getBillById);

// Customer-facing routes (no auth — validated via sessionId)
router.post('/generate', generateBill);
router.post('/create-payment-intent', createPaymentIntent);
router.post('/confirm-stripe-payment', confirmStripePayment);

export default router;