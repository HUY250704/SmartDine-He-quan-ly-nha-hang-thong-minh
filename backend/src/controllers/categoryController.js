import Category from '../models/Category.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort('order');
    res.json({ status: 'success', message: 'Categories retrieved successfully', data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Category name is required', data: null });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || '',
      order: order || 0
    });

    res.status(201).json({ status: 'success', message: 'Category created successfully', data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, order } = req.body;
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Category name is required', data: null });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found', data: null });
    }

    res.json({ status: 'success', message: 'Category updated successfully', data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found', data: null });
    }

    res.json({ status: 'success', message: 'Category deleted successfully', data: category });
  } catch (error) {
    next(error);
  }
};
