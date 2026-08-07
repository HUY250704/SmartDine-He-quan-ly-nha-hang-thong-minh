import express from 'express';
import { getBills, getBillById, generateBill, getRevenueStats } from '../controllers/billController.js';
import { createPaymentIntent, confirmStripePayment } from '../controllers/stripeController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getBills);
router.get('/stats/revenue', auth, getRevenueStats);
router.get('/:id', auth, getBillById);
router.post('/generate', auth, generateBill);

// Stripe routes
router.post('/create-payment-intent', auth, createPaymentIntent);
router.post('/confirm-stripe-payment', auth, confirmStripePayment);

export default router;
