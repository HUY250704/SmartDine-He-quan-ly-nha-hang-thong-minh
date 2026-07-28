import express from 'express';
import { getBills, getBillById, generateBill, getRevenueStats } from '../controllers/billController.js';

const router = express.Router();

router.get('/', getBills);
router.get('/stats/revenue', getRevenueStats);
router.get('/:id', getBillById);
router.post('/generate', generateBill);

export default router;
