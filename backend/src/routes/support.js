import express from 'express';
import { callStaff, requestPayment } from '../controllers/supportController.js';

const router = express.Router();

router.post('/call', callStaff);
router.post('/payment', requestPayment);

export default router;