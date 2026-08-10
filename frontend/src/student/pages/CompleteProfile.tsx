import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StudentService } from '../../services/StudentService';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, User, Phone, MapPin, Briefcase, GraduationCap, ArrowRight } from 'lucide-react';

export default function CompleteProfile() {
  const { currentUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [education, setEducation] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.displayName || '');
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !age) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profileData = {
        uid: currentUser?.uid,
        name,
        email: currentUser?.email,
        phone,
        age: parseInt(age, 10),
        city,
        education,
        currentStatus,
        avatar: currentUser?.photoURL || '',
        photoURL: currentUser?.photoURL || '',
      };

      await StudentService.saveStudentProfile(profileData);
      refreshProfile(); // Fetch the new profile to context
      navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center font-sans">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-[#1763B6] p-6 text-center text-white">
          <h2 className="text-2xl font-bold font-display">Complete Your Profile</h2>
          <p className="text-blue-100 text-sm mt-1">Please provide a few more details to set up your account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-center mb-6">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-24 h-24 rounded-full border-4 border-slate-50 object-cover shadow-sm" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-slate-50 flex items-center justify-center text-slate-400">
                <User className="w-12 h-12" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1763B6]/20 focus:border-[#1763B6] transition-all bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Phone className="w-4 h-4"/></span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1763B6]/20 focus:border-[#1763B6] transition-all bg-slate-50 focus:bg-white"
                    placeholder="+91"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Age *</label>
                <input
                  type="number"
                  required
                  min="16"
                  max="100"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1763B6]/20 focus:border-[#1763B6] transition-all bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">City (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><MapPin className="w-4 h-4"/></span>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1763B6]/20 focus:border-[#1763B6] transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Education (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><GraduationCap className="w-4 h-4"/></span>
                  <input
                    type="text"
                    value={education}
                    onChange={e => setEducation(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1763B6]/20 focus:border-[#1763B6] transition-all bg-slate-50 focus:bg-white"
                    placeholder="e.g. B.Tech, MBA"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Current Status (Optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Briefcase className="w-4 h-4"/></span>
                <select
                  value={currentStatus}
                  onChange={e => setCurrentStatus(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1763B6]/20 focus:border-[#1763B6] transition-all bg-slate-50 focus:bg-white"
                >
                  <option value="">Select Status</option>
                  <option value="Student">Student</option>
                  <option value="Working Professional">Working Professional</option>
                  <option value="Career Switcher">Career Switcher</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#1763B6] hover:bg-[#145096] text-white rounded-xl font-bold shadow-sm transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (
              <>
                Save & Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
