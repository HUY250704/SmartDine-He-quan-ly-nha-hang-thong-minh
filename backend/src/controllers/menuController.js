import MenuItem from '../models/MenuItem.js';
import { generateContent } from '../services/aiService.js';
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

// Friendly message mapping for known AI failure modes.
const AI_ERROR_MESSAGES = {
  ai_quota_exceeded: 'AI hiện đang bị giới hạn quota. Vui lòng thử lại sau khoảng 30 giây.',
  ai_unauthorized: 'AI service chưa được cấu hình đúng trên máy chủ.',
  ai_upstream_error: 'Nhà cung cấp AI đang tạm thời không khả dụng. Vui lòng thử lại sau.',
};

const AI_ERROR_STATUS = {
  ai_quota_exceeded: 429,
  ai_unauthorized: 502,
  ai_upstream_error: 502,
};

export const generateAiDescription = async (req, res) => {
  try {
    const { name, category, type } = req.body;
    if (!name) return res.status(400).json({ error: 'Menu item name is required' });

    const isUpsell = type === 'upsell';
    const catSuffix = category ? ` thuộc danh mục "${category}"` : '';
    const prompt = isUpsell
      ? `Bạn là chuyên gia ẩm thực. Đề xuất 3 món ăn kèm hoặc đồ uống gợi ý upsell bằng tiếng Việt cho món "${name}"${catSuffix}. Trả lời ngắn gọn, mỗi gợi ý 1 dòng, cách nhau bằng dấu xuống dòng. Chỉ trả lời danh sách gợi ý, không thêm lời dẫn.`
      : `Bạn là chuyên gia ẩm thực. Viết một mô tả hấp dẫn, ngắn gọn bằng tiếng Việt cho món "${name}"${catSuffix}. Giới hạn 2-3 câu, tập trung vào hương vị, nguyên liệu và trải nghiệm. Chỉ trả lời mô tả, không thêm lời dẫn.`;

    const resultText = await generateContent(prompt);
    res.json({ [isUpsell ? 'upsellSuggestion' : 'aiDescription']: resultText });
  } catch (error) {
    console.error('[AI] generateContent failed:', error);

    if (error?.name === 'AiServiceError' && error.code && AI_ERROR_MESSAGES[error.code]) {
      return res.status(AI_ERROR_STATUS[error.code]).json({
        error: AI_ERROR_MESSAGES[error.code],
        code: error.code,
      });
    }

    if (error?.message?.includes('OPENROUTER_API_KEY')) {
      return res.status(503).json({
        error: 'AI service chưa được cấu hình trên máy chủ. Vui lòng liên hệ quản trị viên.',
        code: 'ai_not_configured',
      });
    }

    res.status(500).json({ error: 'Không thể tạo nội dung AI. Vui lòng thử lại sau.' });
  }
};