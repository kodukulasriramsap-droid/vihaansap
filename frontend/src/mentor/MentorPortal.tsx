import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useOutletContext, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MentorRecord, MentorService } from '../services/MentorService';
import BatchDashboard from '../admin/pages/BatchDashboard';

// ─── Layout ────────────────────────────────────────────────────────────────────
export function MentorLayout() {
  const { currentUser, logout } = useAuth();
  const [mentor, setMentor] = useState<MentorRecord | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    let unsubscribe = () => undefined as void;
    MentorService.validateSession()
      .then(record => {
        setMentor(record);
        setLoading(false);
        unsubscribe = MentorService.subscribeMine(
          record.email,
          updatedRecord => {
            setMentor(updatedRecord);
            if (updatedRecord && updatedRecord.status !== 'active') setError('disabled');
          },
          () => setError('denied')
        );
      })
      .catch(() => { setError('denied'); setLoading(false); });
    return () => unsubscribe();
  }, [currentUser]);

  // Not authenticated — redirect to login
  if (!currentUser) return <Navigate to="/mentor" replace />;

  // Still validating session — show a spinner
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      Loading mentor portal...
    </div>
  );

  // Authentication/authorisation failed
  if (error) return <Navigate to="/mentor" replace />;

  // Mentor loaded but disabled
  if (mentor && mentor.status !== 'active') return <Navigate to="/mentor" replace />;

  // Mentor not yet resolved (edge-case guard) — keep spinner
  if (!mentor) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      Loading mentor portal...
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
        <Link to="/mentor/dashboard" className="font-bold text-lg">Mentor Portal</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">{mentor.name || mentor.email}</span>
          <button
            onClick={() => void logout()}
            className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      <div className="max-w-7xl mx-auto p-6">
        <Outlet context={mentor} />
      </div>
    </main>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export function MentorDashboard() {
  const mentor = useOutletContext<MentorRecord>();
  const [batches, setBatches] = useState<any[]>([]);
  const [batchError, setBatchError] = useState('');

  useEffect(() => {
    if (mentor) {
      return MentorService.subscribeAssignedBatches(
        mentor,
        setBatches,
        err => setBatchError(err.message)
      );
    }
  }, [mentor]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Batches</h1>
        <p className="mt-1 text-slate-500">Only administrator-assigned batches are available.</p>
      </div>

      {batchError && (
        <p className="text-sm text-red-600 mb-4">{batchError}</p>
      )}

      {batches.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-500">
          No batches are currently assigned to you. Please contact the administrator.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {batches.map(b => (
            <Link
              key={b.id}
              to={`/mentor/batches/${b.id}`}
              className="rounded-xl border bg-white p-5 hover:border-blue-500 hover:shadow-md transition-all"
            >
              <h2 className="font-bold text-slate-800">{b.name}</h2>
              <p className="text-sm text-slate-500 mt-1">{b.course}</p>
              <p className="text-xs text-slate-400 mt-3">Click to manage batch →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Batch (full BatchDashboard, scoped to mentor's authorised batch) ──────────
export function MentorBatch() {
  const { batchId } = useParams();
  const mentor = useOutletContext<MentorRecord>();
  const [authorised, setAuthorised] = useState<boolean | null>(null);

  useEffect(() => {
    if (mentor && batchId) {
      // Security: only allow access if batchId is in the mentor's assigned list
      setAuthorised(mentor.assignedBatchIds.includes(batchId));
    }
  }, [mentor, batchId]);

  if (authorised === null) return <p className="text-slate-500 p-4">Checking access...</p>;
  if (!authorised) return <Navigate to="/mentor/dashboard" replace />;

  return (
    <div>
      <Link
        to="/mentor/dashboard"
        className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800 mb-6"
      >
        ← Back to My Batches
      </Link>
      {/* Reuse the full admin BatchDashboard — it reads batchId from the URL */}
      <BatchDashboard />
    </div>
  );
}
