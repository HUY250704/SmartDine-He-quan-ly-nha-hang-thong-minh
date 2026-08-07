import express from 'express';
import { getBills, getBillById, generateBill, getRevenueStats } from '../controllers/billController.js';
import { createPaymentIntent, confirmStripePayment } from '../controllers/stripeController.js';

const router = express.Router();

router.get('/', getBills);
router.get('/stats/revenue', getRevenueStats);
router.get('/:id', getBillById);
router.post('/generate', generateBill);

// Stripe routes
router.post('/create-payment-intent', createPaymentIntent);
router.post('/confirm-stripe-payment', confirmStripePayment);

export default router;