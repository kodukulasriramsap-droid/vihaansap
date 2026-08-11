import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDB } from '../../hooks/useDB';
import { PlayCircle, Calendar } from 'lucide-react';
import { isTargetedToStudent } from '../../utils/recipientTargeting';
import { useActiveBatch } from '../contexts/ActiveBatchContext';
import { markContentRead } from '../../utils/contentReadState';

export default function RecordedClasses() {
  const { studentProfile } = useAuth();
  const db = useDB();

  const { activeBatch } = useActiveBatch();
  
  // 1. Recordings from completed sessions
  const mySessions = db.batchSessions?.filter(s => s.batchId === activeBatch?.id && isTargetedToStudent(s, studentProfile)) || [];
  const sessionRecordings = mySessions.filter(s => s.status === 'Completed' && s.recordingUrl).map(s => ({
    id: s.id,
    topic: s.topic,
    date: s.date,
    batchId: s.batchId,
    recordingUrl: s.recordingUrl
  }));

  // 2. Standalone uploaded recordings
  const standaloneRecordings = db.recordings?.filter(r => 
    r.batchId === activeBatch?.id && r.visibility !== 'Hidden' && isTargetedToStudent(r, studentProfile)
  ).map(r => ({
    id: r.id,
    topic: r.title,
    date: r.date || r.uploadDate,
    batchId: r.batchId,
    recordingUrl: r.videoUrl
  })) || [];

  const recordedSessions = [...sessionRecordings, ...standaloneRecordings]
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  useEffect(() => {
    if (recordedSessions.length > 0) {
      markContentRead(recordedSessions.map(r => r.id), studentProfile, 'recordings');
    }
  }, [recordedSessions, studentProfile]);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">Recorded Classes</h2>
        <p className="text-slate-500 text-sm mt-1">Access recordings of your past live sessions.</p>
      </div>

      {recordedSessions.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-500">
          {activeBatch ? 'No recordings available for this batch yet.' : 'No active batch assigned yet.'}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          {recordedSessions.map((rec, index) => {
            const batch = db.batches.find(b => b.id === rec.batchId);
            return (
              <div key={rec.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-slate-50/80 transition-colors gap-2 sm:gap-4 ${index !== recordedSessions.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm truncate">{rec.topic}</h3>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 shrink-0">
                  <div className="flex items-center gap-4 sm:gap-8 text-xs text-slate-500">
                    <span className="w-auto sm:w-32 truncate">{batch?.course}</span>
                    <span className="w-20 sm:w-24 shrink-0 whitespace-nowrap">{rec.date}</span>
                  </div>
                  <a 
                    href={rec.recordingUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded text-xs font-semibold transition-colors shrink-0"
                  >
                    <PlayCircle className="w-3.5 h-3.5" /> Watch
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
