import express from 'express';
import { openSession, closeSession } from '../controllers/sessionController.js';

const router = express.Router();

router.post('/open', openSession);
router.post('/close', closeSession);

export default router;