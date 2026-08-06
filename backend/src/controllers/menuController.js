import MenuItem from '../models/MenuItem.js';
import { withRetry } from '../utils/retry.js';
import { generateContent } from '../services/geminiService.js';
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

    const isUpsell = type === "upsell";
    const catSuffix = category ? ` thuộc danh mục "${category}"` : "";
    const prompt = isUpsell
      ? `Bạn là chuyên gia ẩm thực. Đề xuất 3 món ăn kèm hoặc đồ uống gợi ý upsell bằng tiếng Việt cho món "${name}"${catSuffix}. Trả lời ngắn gọn, mỗi gợi ý 1 dòng, cách nhau bằng dấu xuống dòng. Chỉ trả lời danh sách gợi ý, không thêm lời dẫn.`
      : `Bạn là chuyên gia ẩm thực. Viết một mô tả hấp dẫn, ngắn gọn bằng tiếng Việt cho món "${name}"${catSuffix}. Giới hạn 2-3 câu, tập trung vào hương vị, nguyên liệu và trải nghiệm. Chỉ trả lời mô tả, không thêm lời dẫn.`;

    const resultText = await generateContent(prompt);
    res.json({ [isUpsell ? "upsellSuggestion" : "aiDescription"]: resultText });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI content" });
  }
};