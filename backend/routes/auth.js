import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireLogin, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper: create a JWT for a user.
// Payload is tiny on purpose: { id, role } — easy to explain.
function makeToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
// Body: { name, email, password, role? }
// Anyone can register. First manager account: register then change role in DB,
// or pass role: "manager" (we allow it to keep the demo simple).
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Never store plain passwords — hash with bcrypt (10 rounds).
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role: ['manager', 'admin'].includes(role) ? role : 'member',
    });

    const token = makeToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Register failed', error: err.message });
  }
});

// POST /api/auth/login
// Body: { email, password }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = makeToken(user);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// GET /api/auth/me — who am I? (needs token)
// Used by frontend on page reload to restore login from localStorage.
router.get('/me', requireLogin, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
});

// GET /api/auth/users — manager/admin only.
// Used for "filter by member" dropdowns on review pages.
router.get('/users', requireLogin, async (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Managers only' });
  }
  const users = await User.find().select('name email role').sort({ name: 1 });
  res.json(users.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role })));
});

// PUT /api/auth/users/:id — admin only. Body: { role }
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { role } = req.body;
    if (!['member', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    user.role = role;
    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
});

export default router;
