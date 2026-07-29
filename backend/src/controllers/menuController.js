import MenuItem from '../models/MenuItem.js';
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
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Menu item name is required' });

    const prompt = category
      ? 'Vi?t m?t mô t? h?p d?n b?ng ti?ng Vi?t cho món "' + name + '" thu?c danh m?c "' + category + '". Gi?i h?n 2-3 câu.'
      : 'Vi?t m?t mô t? h?p d?n b?ng ti?ng Vi?t cho món "' + name + '". Gi?i h?n 2-3 câu.';

    const aiDesc = 'Mô t? AI cho món: ' + name;
    res.json({ aiDescription: aiDesc, prompt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
