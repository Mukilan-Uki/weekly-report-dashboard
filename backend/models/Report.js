import mongoose from 'mongoose';

// One manager comment on a report (approve note or correction request).
const commentSchema = new mongoose.Schema(
  {
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// One saved copy of the report content before an edit.
// This is the "version history": every edit keeps the old text.
const versionSchema = new mongoose.Schema(
  {
    done: String,
    plan: String,
    blockers: String,
    hours: Number,
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Weekly report model.
// Workflow: draft -> submitted -> approved
//                              -> needs-correction -> (edit) -> submitted ...
const reportSchema = new mongoose.Schema(
  {
    // Who wrote this report
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Optional project/category, e.g. Development
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    // e.g. "2026-08-31" (Monday of that week). String keeps filtering simple.
    weekStart: {
      type: String,
      required: true,
    },
    // Fixed report structure
    done: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      required: true,
    },
    blockers: {
      type: String,
      default: '',
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
      max: 168,
    },
    // Review workflow status
    status: {
      type: String,
      enum: ['draft', 'submitted', 'needs-correction', 'approved'],
      default: 'draft',
    },
    // Manager feedback trail
    comments: [commentSchema],
    // Old copies, newest last
    versions: [versionSchema],
  },
  { timestamps: true }
);

// One person can only have ONE report per week.
reportSchema.index({ user: 1, weekStart: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);

export default Report;
