import express from "express";
import { openSession, closeSession, switchTable, getActiveSessionByTable } from "../controllers/sessionController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/open", auth, openSession);
router.post("/close", auth, closeSession);
router.post("/switch", auth, switchTable);
router.get("/table/:id/active", getActiveSessionByTable);

export default router;
