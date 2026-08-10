import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MockDB } from '../../services/MockDB';

export default function SessionFeedbackModal({ session, batch, onClose }: any) {
  const { studentProfile } = useAuth();
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const feedback = {
      sessionId: session.id,
      batchId: batch.id,
      studentId: studentProfile?.id,
      helpful: helpful || false,
      rating,
      comments,
      date: new Date().toISOString()
    };
    MockDB.addItem('sessionFeedback', feedback);
    setSubmitted(true);
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 fill-current" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Thank You!</h3>
              <p className="text-slate-500 mt-2">Your feedback helps us improve.</p>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Session Feedback</h3>
              <p className="text-sm text-slate-500 mb-6 font-semibold">{session.topic}</p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Was today's session helpful?</label>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setHelpful(true)} className={`flex-1 py-2 rounded-lg font-bold border transition-colors ${helpful === true ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Yes</button>
                    <button type="button" onClick={() => setHelpful(false)} className={`flex-1 py-2 rounded-lg font-bold border transition-colors ${helpful === false ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>No</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          rating >= star ? 'bg-orange-100 text-orange-500' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Star className={`w-6 h-6 ${rating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Comments (Optional)</label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors resize-none"
                    placeholder="Tell us what you liked or what could be better..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={rating === 0 || helpful === null}
                  className="w-full py-3 bg-[#1763B6] text-white font-bold rounded-xl hover:bg-[#145096] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Feedback
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
