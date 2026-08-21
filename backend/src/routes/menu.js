import express from "express";
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem, uploadMenuImage, generateAiDescription } from "../controllers/menuController.js";
import { auth } from "../middleware/auth.js";
import { upload } from "../config/upload.js";

const router = express.Router();

router.get("/", getMenu);

// Admin-only routes
router.post("/", auth, isAdmin, upload.single("image"), createMenuItem);
router.put("/:id", auth, isAdmin, upload.single("image"), updateMenuItem);
router.delete("/:id", auth, isAdmin, deleteMenuItem);
router.post("/upload", auth, isAdmin, upload.single("image"), uploadMenuImage);
router.post("/ai-description", auth, generateAiDescription);

// Public: user-facing AI description (no auth)
router.post("/public/ai-description", generateAiDescription);

export default router;
