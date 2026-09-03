import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import StatusBadge from '../components/StatusBadge';

// Page 4: Report detail — read-only view with comments + version history.
export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get(`/reports/${id}`)
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!report) return <p>Report not found.</p>;

  return (
    <div>
      <p>
        <Link to="/history">← Back to history</Link>
      </p>
      <div className="card">
        <div className="row between">
          <h2>
            {report.user?.name} — week of {report.weekStart}
          </h2>
          <StatusBadge status={report.status} />
        </div>
        <p>
          <strong>Hours:</strong> {report.hours}h
        </p>
        {report.category?.name && (
          <p>
            <strong>Category:</strong> {report.category.name}
          </p>
        )}
        <p>
          <strong>Done:</strong>
        </p>
        <p>{report.done}</p>
        <p>
          <strong>Plan:</strong>
        </p>
        <p>{report.plan}</p>
        {report.blockers && (
          <>
            <p>
              <strong>Blockers:</strong>
            </p>
            <p>{report.blockers}</p>
          </>
        )}
      </div>

      <div className="card">
        <h3>Manager comments ({report.comments?.length || 0})</h3>
        {!report.comments?.length && <p className="muted">No comments yet.</p>}
        {report.comments?.map((c, i) => (
          <div key={i} className="recent">
            <strong>{c.by?.name || 'Manager'}:</strong> {c.text}
            <div className="muted">{new Date(c.at).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Version history ({report.versions?.length || 0})</h3>
        {!report.versions?.length && (
          <p className="muted">No edits yet — versions appear here after each save.</p>
        )}
        {report.versions?.map((v, i) => (
          <div key={i} className="recent">
            <strong>
              v{i + 1} — {new Date(v.at).toLocaleString()} — {v.hours}h
            </strong>
            <div className="muted">Done: {v.done}</div>
            <div className="muted">Plan: {v.plan}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
