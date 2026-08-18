import express from "express";
import { auth } from "../middleware/auth.js";
import { getServiceStatus, availableKeyCount, availableModelCount } from "../services/groqService.js";

const router = express.Router();

// GET /api/admin/ai-status — debug chỉ dành cho admin, tắt ở production.
router.get("/ai-status", auth, (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" });
  }

  res.json({
    availableKeys: availableKeyCount(),
    availableModels: availableModelCount(),
    detail: getServiceStatus(),
  });
});

export default router;
