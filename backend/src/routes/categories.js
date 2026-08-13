import express from "express";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers/categoryController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Public: customers need to view categories
router.get("/", getCategories);

// Admin-only routes
router.post("/", auth, createCategory);
router.put("/:id", auth, updateCategory);
router.delete("/:id", auth, deleteCategory);

export default router;
