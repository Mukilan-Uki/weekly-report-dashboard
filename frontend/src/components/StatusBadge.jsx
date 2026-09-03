// Reusable status pill used on every page that shows a report.
// Colors: draft = gray, submitted = blue, needs-correction = orange, approved = green.
const LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  'needs-correction': 'Needs Correction',
  approved: 'Approved',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {LABELS[status] || status}
    </span>
  );
}
