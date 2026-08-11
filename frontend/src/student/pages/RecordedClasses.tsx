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
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {recordedSessions.map(rec => {
            const batch = db.batches.find(b => b.id === rec.batchId);
            return (
              <div key={rec.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight">{rec.topic}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1763B6] bg-blue-50 px-2 py-0.5 rounded">
                      {batch?.course}
                    </span>
                    <span className="text-xs text-slate-500">{rec.date}</span>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <a 
                    href={rec.recordingUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                  >
                    <PlayCircle className="w-4 h-4" /> Watch
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
