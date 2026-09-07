import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await client.get(`/reports/${id}`);
        setReport(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load report');
      }
    }
    load();
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!report) return <p>Loading...</p>;

  return (
    <div>
      <div className="row between">
        <h2>Report Detail</h2>
        <Link to="/reports" className="secondary">Back to My Reports</Link>
      </div>
      <div className="card">
        <div className="row between">
          <strong>Week of {report.weekStart}</strong>
          <span className={`badge ${report.status}`}>{report.status}</span>
        </div>
        <p>
          <strong>Author:</strong> {report.user?.name}
        </p>
        <p>
          <strong>Category:</strong> {report.category?.name || '—'}
        </p>
        <p>
          <strong>Hours:</strong> {report.hours}h
        </p>
        <hr />
        <p>
          <strong>Done this week:</strong>
        </p>
        <p>{report.done}</p>
        <p>
          <strong>Plan for next week:</strong>
        </p>
        <p>{report.plan}</p>
        <p>
          <strong>Blockers:</strong>
        </p>
        <p>{report.blockers || 'None'}</p>
        <p>
          <strong>Achievements:</strong>
        </p>
        <p>{report.achievements || 'None'}</p>
        <p>
          <strong>Notes / Links:</strong>
        </p>
        <p>{report.notes || 'None'}</p>
      </div>

      {report.comments?.length > 0 && (
        <div className="card">
          <h3>Comments</h3>
          {report.comments.map((c, i) => (
            <div key={i} className="comment">
              <strong>{c.by?.name || 'Manager'}</strong> — {new Date(c.at).toLocaleString()}
              <p>{c.text}</p>
            </div>
          ))}
        </div>
      )}

      {report.versions?.length > 0 && (
        <div className="card">
          <h3>Version History</h3>
          {report.versions.map((v, i) => (
            <div key={i} className="version">
              <strong>Version {i + 1}</strong> — {new Date(v.at).toLocaleString()}
              <p>
                <strong>Done:</strong> {v.done}
              </p>
              <p>
                <strong>Plan:</strong> {v.plan}
              </p>
              <p>
                <strong>Blockers:</strong> {v.blockers || 'None'}
              </p>
              <p>
                <strong>Achievements:</strong> {v.achievements || 'None'}
              </p>
              <p>
                <strong>Notes:</strong> {v.notes || 'None'}
              </p>
              <p>
                <strong>Hours:</strong> {v.hours}h
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
