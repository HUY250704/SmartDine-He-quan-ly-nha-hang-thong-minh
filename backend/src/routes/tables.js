import express from "express";
import { getTables, createTable, updateTable, deleteTable } from "../controllers/tableController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Public route for customer-facing "Ð?i bàn" — no auth required
router.get("/public", getTables);

// Admin-only routes
router.get("/", auth, getTables);
router.post("/", auth, createTable);
router.put("/:id", auth, updateTable);
router.delete("/:id", auth, deleteTable);

export default router;