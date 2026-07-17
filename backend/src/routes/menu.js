import express from 'express';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem, generateAiDescription } from '../controllers/menuController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getMenu);
router.post('/', auth, createMenuItem);
router.put('/:id', auth, updateMenuItem);
router.delete('/:id', auth, deleteMenuItem);
router.post('/ai-description', auth, generateAiDescription);

export default router;