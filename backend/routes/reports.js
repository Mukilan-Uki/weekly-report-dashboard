import express from 'express';
import Report from '../models/Report.js';
import { requireLogin } from '../middleware/auth.js';

const router = express.Router();

// All report routes need login.
router.use(requireLogin);

// GET /api/reports?weekStart=2026-08-31
// - member: only MY reports
// - manager: ALL reports (can also filter ?user=<id> or ?weekStart=...)
router.get('/', async (req, res) => {
  try {
    const filter = {};

    // Members only see their own reports. Managers see everything.
    if (req.user.role !== 'manager') {
      filter.user = req.user.id;
    } else if (req.query.user) {
      filter.user = req.query.user;
    }

    if (req.query.weekStart) {
      filter.weekStart = req.query.weekStart;
    }

    const reports = await Report.find(filter)
      .populate('user', 'name email')
      .sort({ weekStart: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load reports', error: err.message });
  }
});

// POST /api/reports
// Body: { weekStart, done, plan, blockers?, hours }
router.post('/', async (req, res) => {
  try {
    const { weekStart, done, plan, blockers, hours } = req.body;

    if (!weekStart || !done || !plan || hours === undefined) {
      return res.status(400).json({ message: 'weekStart, done, plan and hours are required' });
    }

    const report = await Report.create({
      user: req.user.id,
      weekStart,
      done,
      plan,
      blockers: blockers || '',
      hours: Number(hours),
    });

    await report.populate('user', 'name email');
    res.status(201).json(report);
  } catch (err) {
    // 11000 = duplicate key (same user + same weekStart)
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You already submitted a report for this week' });
    }
    res.status(500).json({ message: 'Failed to create report', error: err.message });
  }
});

// PUT /api/reports/:id
// Members can edit ONLY their own. Managers can edit any.
router.put('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const isOwner = report.user.toString() === req.user.id;
    if (req.user.role !== 'manager' && !isOwner) {
      return res.status(403).json({ message: 'You can only edit your own reports' });
    }

    const { done, plan, blockers, hours } = req.body;
    if (done !== undefined) report.done = done;
    if (plan !== undefined) report.plan = plan;
    if (blockers !== undefined) report.blockers = blockers;
    if (hours !== undefined) report.hours = Number(hours);

    await report.save();
    await report.populate('user', 'name email');
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update report', error: err.message });
  }
});

// DELETE /api/reports/:id
// Members can delete ONLY their own. Managers can delete any.
router.delete('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const isOwner = report.user.toString() === req.user.id;
    if (req.user.role !== 'manager' && !isOwner) {
      return res.status(403).json({ message: 'You can only delete your own reports' });
    }

    await report.deleteOne();
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete report', error: err.message });
  }
});

export default router;
