import MenuItem from '../models/MenuItem.js';

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

    const menuItem = await MenuItem.create({ name, price, description, image, isAvailable, aiDescription, upsellSuggestion, categoryId });
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!menuItem) return res.status(404).json({ error: 'Menu item not found' });
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!menuItem) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ message: 'Menu item deleted' });
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