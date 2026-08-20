import express from "express";
import { openSession, closeSession, switchTable, getActiveSessionByTable } from "../controllers/sessionController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Customer-facing routes (no auth — validated via sessionId/tableId)
router.post("/open", openSession);
router.post("/switch", switchTable);
router.get("/table/:id/active", getActiveSessionByTable);

// Admin-only routes
router.post("/close", auth, closeSession);

export default router;