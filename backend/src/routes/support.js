import express from 'express';
import { callStaff, requestPayment, getRequests, resolveRequest } from '../controllers/supportController.js';

const router = express.Router();

router.get('/', getRequests);
router.post('/call', callStaff);
router.post('/payment', requestPayment);
router.put('/:id/resolve', resolveRequest);

export default router;
