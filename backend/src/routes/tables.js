import express from "express";
import { getTables, createTable, updateTable, deleteTable } from "../controllers/tableController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Public route for customer-facing "Ð?i bàn" — no auth required
router.get("/public", getTables);

// Admin-only routes
router.get("/", auth, getTables);
router.post("/", auth, isAdmin, createTable);
router.put("/:id", auth, isAdmin, updateTable);
router.delete("/:id", auth, isAdmin, deleteTable);

export default router;