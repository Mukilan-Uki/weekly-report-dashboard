import mongoose from 'mongoose';

// Weekly report model.
// One report = one person, one week.
// Keep fields simple strings so it is easy to explain in live coding.
const reportSchema = new mongoose.Schema(
  {
    // Who wrote this report
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // e.g. "2026-08-31" (Monday of that week). Stored as string to keep filtering simple.
    weekStart: {
      type: String,
      required: true,
    },
    // What you finished this week
    done: {
      type: String,
      required: true,
    },
    // What you plan next week
    plan: {
      type: String,
      required: true,
    },
    // Any blockers / issues
    blockers: {
      type: String,
      default: '',
    },
    // Hours worked this week
    hours: {
      type: Number,
      required: true,
      min: 0,
      max: 168,
    },
  },
  { timestamps: true }
);

// One person can only submit ONE report per week.
// This prevents duplicates and is easy to explain.
reportSchema.index({ user: 1, weekStart: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);

export default Report;
