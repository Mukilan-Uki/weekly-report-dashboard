import express from 'express';
import Report from '../models/Report.js';
import User from '../models/User.js';
import { requireLogin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireLogin);

// GET /api/dashboard/summary?weekStart=2026-08-31
// Returns small numbers for the Team Dashboard page:
// - totalReports, totalHours, totalMembers
// - hoursByUser: [{ name, hours, count }]  <- used for the bar chart
// - recent: last 5 reports
//
// Members see ONLY their own numbers. Managers see the whole team.
router.get('/summary', async (req, res) => {
  try {
    const { weekStart } = req.query;
    const isManager = req.user.role === 'manager';

    const reportFilter = {};
    if (!isManager) reportFilter.user = req.user.id;
    if (weekStart) reportFilter.weekStart = weekStart;

    const reports = await Report.find(reportFilter).populate('user', 'name email');
    const memberCount = isManager
      ? await User.countDocuments()
      : 1;

    const totalHours = reports.reduce((sum, r) => sum + (r.hours || 0), 0);

    // Group hours per person for the bar chart.
    const byUser = {};
    for (const r of reports) {
      const key = r.user?._id?.toString() || 'unknown';
      const name = r.user?.name || 'Unknown';
      if (!byUser[key]) byUser[key] = { name, hours: 0, count: 0 };
      byUser[key].hours += r.hours || 0;
      byUser[key].count += 1;
    }

    res.json({
      totalReports: reports.length,
      totalHours,
      totalMembers: memberCount,
      hoursByUser: Object.values(byUser).sort((a, b) => b.hours - a.hours),
      recent: reports.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load summary', error: err.message });
  }
});

export default router;
