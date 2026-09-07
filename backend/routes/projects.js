import express from 'express';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { requireLogin, requireManager, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireLogin);

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('members', 'name email')
      .sort({ name: 1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load projects', error: err.message });
  }
});

router.post('/', requireManager, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const project = await Project.create({
      name: name.trim(),
      description: description || '',
      members: members || [],
    });
    res.status(201).json(project);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Project already exists' });
    }
    res.status(500).json({ message: 'Failed to create project', error: err.message });
  }
});

router.put('/:id', requireManager, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.body.name !== undefined) project.name = req.body.name.trim();
    if (req.body.description !== undefined) project.description = req.body.description;
    if (req.body.members !== undefined) project.members = req.body.members;

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update project', error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete project', error: err.message });
  }
});

export default router;