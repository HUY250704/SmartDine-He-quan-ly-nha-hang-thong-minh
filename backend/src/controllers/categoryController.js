import Category from '../models/Category.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort('order');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, order } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const category = await Category.create({ name, order: order || 0 });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};