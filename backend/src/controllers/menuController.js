﻿import MenuItem from '../models/MenuItem.js';
import { uploadImage, deleteImage } from '../config/upload.js';

export const getMenu = async (req, res) => {
  try {
    const filter = {};
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.isAvailable !== undefined) filter.isAvailable = req.query.isAvailable === 'true';

    const menu = await MenuItem.find(filter).populate('categoryId', 'name order').sort('name');
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createMenuItem = async (req, res) => {
  try {
    const { name, price, description, image, isAvailable, aiDescription, upsellSuggestion, categoryId } = req.body;
    if (!name || price == null || !categoryId) {
      return res.status(400).json({ error: 'name, price, and categoryId are required' });
    }

    let imageUrl = image || '';
    let imagePublicId = '';

    // If file was uploaded via multer
    if (req.file) {
      const result = await uploadImage(req.file.buffer, 'smartdine/menu');
      imageUrl = result.url;
      imagePublicId = result.publicId;
    }

    const menuItem = await MenuItem.create({
      name, price, description, image: imageUrl, imagePublicId,
      isAvailable, aiDescription, upsellSuggestion, categoryId
    });
    const populated = await menuItem.populate('categoryId', 'name order');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) return res.status(404).json({ error: 'Menu item not found' });

    let updateData = { ...req.body };

    // If new file uploaded, delete old image from Cloudinary and upload new one
    if (req.file) {
      if (menuItem.imagePublicId) {
        await deleteImage(menuItem.imagePublicId).catch(() => {});
      }
      const result = await uploadImage(req.file.buffer, 'smartdine/menu');
      updateData.image = result.url;
      updateData.imagePublicId = result.publicId;
    }

    const updated = await MenuItem.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate('categoryId', 'name order');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) return res.status(404).json({ error: 'Menu item not found' });

    // Delete image from Cloudinary
    if (menuItem.imagePublicId) {
      await deleteImage(menuItem.imagePublicId).catch(() => {});
    }

    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadMenuImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await uploadImage(req.file.buffer, 'smartdine/menu');
    res.json({ url: result.url, publicId: result.publicId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateAiDescription = async (req, res) => {
  try {
    const { name, category, type } = req.body;
    if (!name) return res.status(400).json({ error: "Menu item name is required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    const isBearerToken = apiKey.startsWith("AQ.");
    const model = "gemini-2.0-flash";
    const isUpsell = type === "upsell";
    const catSuffix = category ? ` thuộc danh mục "${category}"` : "";
    const prompt = isUpsell
      ? `Bạn là chuyên gia ẩm thực. Đề xuất 3 món ăn kèm hoặc đồ uống gợi ý upsell bằng tiếng Việt cho món "${name}"${catSuffix}. Trả lời ngắn gọn, mỗi gợi ý 1 dòng, cách nhau bằng dấu xuống dòng. Chỉ trả lời danh sách gợi ý, không thêm lời dẫn.`
      : `Bạn là chuyên gia ẩm thực. Viết một mô tả hấp dẫn, ngắn gọn bằng tiếng Việt cho món "${name}"${catSuffix}. Giới hạn 2-3 câu, tập trung vào hương vị, nguyên liệu và trải nghiệm. Chỉ trả lời mô tả, không thêm lời dẫn.`;

    let text;
    if (isBearerToken) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
      text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    } else {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const genModel = genAI.getGenerativeModel({ model });
      const result = await genModel.generateContent(prompt);
      text = result.response.text().trim();
    }

    res.json({ [isUpsell ? "upsellSuggestion" : "aiDescription"]: text });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI content" });
  }
} = req.body;
    if (!name) return res.status(400).json({ error: "Menu item name is required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const isUpsell = type === "upsell";
    const catSuffix = category ? ` thuộc danh mục "${category}"` : "";

    const prompt = isUpsell
      ? `Bạn là chuyên gia ẩm thực. Đề xuất 3 món ăn kèm hoặc đồ uống gợi ý upsell bằng tiếng Việt cho món "${name}"${catSuffix}. Trả lời ngắn gọn, mỗi gợi ý 1 dòng, cách nhau bằng dấu xuống dòng. Chỉ trả lời danh sách gợi ý, không thêm lời dẫn.`
      : `Bạn là chuyên gia ẩm thực. Viết một mô tả hấp dẫn, ngắn gọn bằng tiếng Việt cho món "${name}"${catSuffix}. Giới hạn 2-3 câu, tập trung vào hương vị, nguyên liệu và trải nghiệm. Chỉ trả lời mô tả, không thêm lời dẫn.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    res.json({ [isUpsell ? "upsellSuggestion" : "aiDescription"]: text });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI content" });
  }
};
