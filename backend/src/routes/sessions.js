import express from "express";
import { openSession, closeSession, getActiveSessionByTable } from "../controllers/sessionController.js";

const router = express.Router();

router.post("/open", openSession);
router.post("/close", closeSession);
router.get("/table/:id/active", getActiveSessionByTable);

export default router;
