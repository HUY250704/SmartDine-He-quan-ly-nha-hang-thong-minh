import express from "express";
import { getCategories, createCategory } from "../controllers/categoryController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Public: customer cần xem danh mục
router.get("/", getCategories);
router.post("/", auth, createCategory);

export default router;
