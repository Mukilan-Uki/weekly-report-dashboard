import express from 'express';
import Report from '../models/Report.js';
import { requireLogin } from '../middleware/auth.js';
import { aiEnabled, askAI } from '../ai.js';

const router = express.Router();

router.use(requireLogin);

// GET /api/ai/status — is AI configured? Frontend hides AI buttons if false.
router.get('/status', (req, res) => {
  res.json({ enabled: aiEnabled() });
});

// POST /api/ai/polish — fix grammar/clarity of one text field.
// Body: { text }. Used by the report form's "Polish with AI" buttons.
router.post('/polish', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Nothing to polish' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ message: 'Text too long (max 2000 characters)' });
    }

    const improved = await askAI(
      'Improve this weekly work-report text. Fix grammar, keep the meaning, ' +
        'keep it short. Reply with ONLY the improved text, no quotes:\n\n' +
        text
    );

    res.json({ polished: improved });
  } catch (err) {
    const status = err.message.includes('not configured') ? 503 : 502;
    res.status(status).json({ message: err.message });
  }
});

// POST /api/ai/insights — AI summary of reports for a week.
// Body: { weekStart? }. Members get insights on their OWN reports,
// managers/admins on the WHOLE team (same visibility rule as the dashboard).
router.post('/insights', async (req, res) => {
  try {
    const isManager = req.user.role === 'manager' || req.user.role === 'admin';

    const filter = {};
    if (!isManager) filter.user = req.user.id;
    if (req.body.weekStart) filter.weekStart = req.body.weekStart;

    const reports = await Report.find(filter)
      .populate('user', 'name')
      .sort({ weekStart: -1 })
      .limit(10); // cap input size to control cost

    if (reports.length === 0) {
      return res.status(400).json({ message: 'No reports to summarize' });
    }

    const lines = reports.map(
      (r) =>
        `- ${r.user?.name || 'Someone'} (week ${r.weekStart}, ${r.hours}h, ${r.status}): ` +
        `done: ${r.done} | plan: ${r.plan} | blockers: ${r.blockers || 'none'}`
    );

    const summary = await askAI(
      'You are a team-lead assistant. Read these weekly reports and reply in 5-8 short ' +
        'bullet lines: overall progress, top blockers, who may need help. Keep it simple:\n\n' +
        lines.join('\n')
    );

    res.json({ insights: summary });
  } catch (err) {
    const status = err.message.includes('not configured') ? 503 : 502;
    res.status(status).json({ message: err.message });
  }
});

export default router;
