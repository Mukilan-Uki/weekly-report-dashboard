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

    res.json({
      totalReports: reports.length,
      totalHours,
      totalMembers: memberCount,
      byStatus,
      hoursByUser: Object.values(byUser).sort((a, b) => b.hours - a.hours),
      recent: reports.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load summary', error: err.message });
  }
});

export default router;
