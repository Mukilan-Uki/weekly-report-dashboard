import express from 'express';
import Report from '../models/Report.js';
import { requireLogin, requireManager } from '../middleware/auth.js';

const router = express.Router();

// All report routes need login.
router.use(requireLogin);

// What to fill in so frontend can show names instead of ids.
const populates = [
  { path: 'user', select: 'name email' },
  { path: 'category', select: 'name' },
  { path: 'comments.by', select: 'name' },
];

function isManager(user) {
  return user.role === 'manager' || user.role === 'admin';
}

// GET /api/reports?weekStart=...&status=submitted&category=<id>&user=<id>
// - member: only MY reports (user filter ignored)
// - manager/admin: ALL reports, optional filters
router.get('/', async (req, res) => {
  try {
    const filter = {};

    if (!isManager(req.user)) {
      filter.user = req.user.id;
    } else if (req.query.user) {
      filter.user = req.query.user;
    }

    if (req.query.weekStart) filter.weekStart = req.query.weekStart;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    const reports = await Report.find(filter)
      .populate(populates)
      .sort({ weekStart: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load reports', error: err.message });
  }
});

// GET /api/reports/:id — read-only detail (owner or manager/admin)
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate(populates);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const owner = report.user._id.toString() === req.user.id;
    if (!isManager(req.user) && !owner) {
      return res.status(403).json({ message: 'You can only view your own reports' });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load report', error: err.message });
  }
});

// POST /api/reports — create a DRAFT.
// Body: { weekStart, done, plan, blockers?, hours, category? }
router.post('/', async (req, res) => {
  try {
    const { weekStart, done, plan, blockers, hours, category } = req.body;

    if (!weekStart || !done || !plan || hours === undefined) {
      return res.status(400).json({ message: 'weekStart, done, plan and hours are required' });
    }

    const report = await Report.create({
      user: req.user.id,
      category: category || null,
      weekStart,
      done,
      plan,
      blockers: blockers || '',
      hours: Number(hours),
      status: 'draft',
    });

    await report.populate(populates);
    res.status(201).json(report);
  } catch (err) {
    // 11000 = duplicate key (same user + same weekStart)
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You already have a report for this week' });
    }
    res.status(500).json({ message: 'Failed to create report', error: err.message });
  }
});

// PUT /api/reports/:id — edit content.
// Owner can edit while draft or needs-correction. Managers/admins can edit any.
// Every edit saves the OLD content into versions[] (version history).
router.put('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const owner = report.user.toString() === req.user.id;
    const editable = ['draft', 'needs-correction'];

    if (!isManager(req.user) && (!owner || !editable.includes(report.status))) {
      return res
        .status(403)
        .json({ message: 'You can only edit your own draft or correction reports' });
    }

    // Save current content as a version BEFORE overwriting.
    report.versions.push({
      done: report.done,
      plan: report.plan,
      blockers: report.blockers,
      hours: report.hours,
    });
    // Keep history short (last 20) so documents stay small.
    if (report.versions.length > 20) {
      report.versions = report.versions.slice(-20);
    }

    const { done, plan, blockers, hours, category } = req.body;
    if (done !== undefined) report.done = done;
    if (plan !== undefined) report.plan = plan;
    if (blockers !== undefined) report.blockers = blockers;
    if (hours !== undefined) report.hours = Number(hours);
    if (category !== undefined) report.category = category || null;

    await report.save();
    await report.populate(populates);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update report', error: err.message });
  }
});

// POST /api/reports/:id/submit — draft/needs-correction -> submitted (owner only)
router.post('/:id/submit', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (report.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only submit your own reports' });
    }
    if (!['draft', 'needs-correction'].includes(report.status)) {
      return res.status(400).json({ message: `Cannot submit a ${report.status} report` });
    }

    report.status = 'submitted';
    await report.save();
    await report.populate(populates);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit report', error: err.message });
  }
});

// POST /api/reports/:id/approve — submitted -> approved (manager/admin).
// Body: { text? } optional approval note, saved as a comment.
router.post('/:id/approve', requireManager, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.status !== 'submitted') {
      return res.status(400).json({ message: 'Only submitted reports can be approved' });
    }

    report.status = 'approved';
    if (req.body.text) {
      report.comments.push({ by: req.user.id, text: req.body.text });
    }

    await report.save();
    await report.populate(populates);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve report', error: err.message });
  }
});

// POST /api/reports/:id/request-changes — submitted -> needs-correction (manager/admin).
// Body: { text } REQUIRED — member needs to know what to fix.
router.post('/:id/request-changes', requireManager, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.status !== 'submitted') {
      return res.status(400).json({ message: 'Only submitted reports can be sent back' });
    }
    if (!req.body.text) {
      return res.status(400).json({ message: 'Please say what needs correction' });
    }

    report.status = 'needs-correction';
    report.comments.push({ by: req.user.id, text: req.body.text });

    await report.save();
    await report.populate(populates);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to request changes', error: err.message });
  }
});

// DELETE /api/reports/:id
// Owner can delete draft/needs-correction. Managers/admins can delete any.
router.delete('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const owner = report.user.toString() === req.user.id;
    const ownerDeletable = ['draft', 'needs-correction'].includes(report.status);

    if (!isManager(req.user) && (!owner || !ownerDeletable)) {
      return res.status(403).json({ message: 'You can only delete your own draft reports' });
    }

    await report.deleteOne();
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete report', error: err.message });
  }
});

export default router;
