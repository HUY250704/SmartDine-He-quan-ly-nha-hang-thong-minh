import express from 'express';
import { callStaff, requestPayment, getRequests, resolveRequest } from '../controllers/supportController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getRequests);
router.post('/call', callStaff);
router.post('/payment', requestPayment);
router.put('/:id/resolve', auth, resolveRequest);

export default router;
