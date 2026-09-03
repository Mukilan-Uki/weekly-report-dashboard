import express from 'express';
import Category from '../models/Category.js';
import { requireLogin, requireManager, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireLogin);

// GET /api/categories — anyone logged in can list (needed for the report form dropdown)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load categories', error: err.message });
  }
});

// POST /api/categories — manager/admin. Body: { name, description? }
router.post('/', requireManager, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const category = await Category.create({ name: name.trim(), description: description || '' });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: 'Failed to create category', error: err.message });
  }
});

// PUT /api/categories/:id — manager/admin. Body: { name?, description? }
router.put('/:id', requireManager, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (req.body.name !== undefined) category.name = req.body.name.trim();
    if (req.body.description !== undefined) category.description = req.body.description;

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update category', error: err.message });
  }
});

// DELETE /api/categories/:id — ADMIN only (this is what makes Admin different).
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    await category.deleteOne();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category', error: err.message });
  }
});

export default router;
