import express from 'express';
import Report from '../models/Report.js';
import User from '../models/User.js';
import { requireLogin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireLogin);

// GET /api/dashboard/summary?weekStart=2026-08-31&status=submitted
// - totalReports, totalHours, totalMembers
// - byStatus: { draft, submitted, needs-correction, approved } <- for the pie chart
// - hoursByUser: [{ name, hours, count }] <- for the bar chart
// - recent: last 5 reports
//
// Members see ONLY their own numbers. Managers/admins see the whole team.
router.get('/summary', async (req, res) => {
  try {
    const { weekStart, status } = req.query;
    const isManager = req.user.role === 'manager' || req.user.role === 'admin';

    const reportFilter = {};
    if (!isManager) reportFilter.user = req.user.id;
    if (weekStart) reportFilter.weekStart = weekStart;
    if (status) reportFilter.status = status;

    const reports = await Report.find(reportFilter).populate('user', 'name email');
    const memberCount = isManager ? await User.countDocuments() : 1;

    const totalHours = reports.reduce((sum, r) => sum + (r.hours || 0), 0);

    // Count reports per workflow status (for the pie chart).
    const byStatus = { draft: 0, submitted: 0, 'needs-correction': 0, approved: 0 };
    const blockersCount = reports.filter((r) => r.blockers && r.blockers.trim() !== '').length;
    const correctionCount = reports.filter((r) => r.status === 'needs-correction').length;
    for (const r of reports) {
      if (byStatus[r.status] !== undefined) byStatus[r.status] += 1;
    }

    // Group hours per person (for the bar chart).
    const byUser = {};
    for (const r of reports) {
      const key = r.user?._id?.toString() || 'unknown';
      const name = r.user?.name || 'Unknown';
      if (!byUser[key]) byUser[key] = { name, hours: 0, count: 0 };
      byUser[key].hours += r.hours || 0;
      byUser[key].count += 1;
    }

    // Group by category.
    const byCategory = {};
    for (const r of reports) {
      const catName = r.category?.name || 'Uncategorized';
      if (!byCategory[catName]) byCategory[catName] = 0;
      byCategory[catName] += 1;
    }

    res.json({
      totalReports: reports.length,
      totalHours,
      totalMembers: memberCount,
      byStatus,
      blockersCount,
      correctionCount,
      complianceRate:
        memberCount > 0
          ? Math.round(((byStatus.approved + byStatus.submitted) / memberCount) * 100)
          : 0,
      hoursByUser: Object.values(byUser).sort((a, b) => b.hours - a.hours),
      hoursByCategory: Object.entries(byCategory).map(([name, count]) => ({ name, count })),
      recent: reports.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load summary', error: err.message });
  }
});

// GET /api/dashboard/trend?weeks=8
// Returns [{ weekStart, count, hours }] for the last N weeks.
router.get('/trend', async (req, res) => {
  try {
    const weeks = Math.min(52, Math.max(1, parseInt(req.query.weeks || '8', 10) || 8));
    const isManager = req.user.role === 'manager' || req.user.role === 'admin';

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - weeks * 7);

    const filter = { weekStart: { $gte: startDate.toISOString().slice(0, 10) } };
    if (!isManager) filter.user = req.user.id;

    const reports = await Report.find(filter).sort({ weekStart: 1 });
    const map = new Map();
    for (const r of reports) {
      if (!map.has(r.weekStart)) {
        map.set(r.weekStart, { weekStart: r.weekStart, count: 0, hours: 0 });
      }
      const entry = map.get(r.weekStart);
      entry.count += 1;
      entry.hours += r.hours || 0;
    }

    res.json(Array.from(map.values()));
  } catch (err) {
    res.status(500).json({ message: 'Failed to load trend', error: err.message });
  }
});

export default router;
