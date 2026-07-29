import express from "express";
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem, uploadMenuImage, generateAiDescription } from "../controllers/menuController.js";
import { auth } from "../middleware/auth.js";
import { upload } from "../config/upload.js";

const router = express.Router();

// Public: customer cần xem menu không cần token
router.get("/", getMenu);

// Admin-only routes
router.post("/", auth, upload.single("image"), createMenuItem);
router.put("/:id", auth, upload.single("image"), updateMenuItem);
router.delete("/:id", auth, deleteMenuItem);
router.post("/upload", auth, upload.single("image"), uploadMenuImage);
router.post("/ai-description", auth, generateAiDescription);

export default router;
