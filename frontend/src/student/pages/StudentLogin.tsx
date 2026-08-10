import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function StudentLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, currentUser, studentProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (currentUser) {
      if (studentProfile) {
        navigate('/student/dashboard', { replace: true });
      } else {
        navigate('/student/complete-profile', { replace: true });
      }
    }
  }, [currentUser, studentProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      // ProtectedRoute will handle the redirect to dashboard or profile completion
      const from = (location.state as any)?.from?.pathname || '/student/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1763B6] to-[#277EDC] flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">SV</span>
          </div>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-display font-extrabold text-slate-900 tracking-tight">
          Student Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sign in to access your courses and materials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl border border-slate-100 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1763B6] hover:bg-[#145096] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1763B6] transition-colors disabled:opacity-70 disabled:cursor-not-allowed items-center gap-2"
              >
                {loading ? 'Signing in...' : (
                  <>
                    Continue with Google
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        <p className="text-center text-xs text-slate-500 mt-8">
          Not enrolled yet? <Link to="/" className="text-[#1763B6] hover:underline font-semibold">Visit Main Website</Link>
        </p>
      </div>
    </div>
  );
}

