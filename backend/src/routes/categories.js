import express from 'express';
import { getCategories, createCategory } from '../controllers/categoryController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getCategories);
router.post('/', auth, createCategory);

export default router;