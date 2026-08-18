import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDB } from '../../hooks/useDB';
import { FileText, Download, ExternalLink, Calendar } from 'lucide-react';
import { downloadFile } from '../../utils/downloadFile';
import { useActiveBatch } from '../contexts/ActiveBatchContext';
import { markContentRead } from '../../utils/contentReadState';

export default function StudyMaterials() {
  const { studentProfile } = useAuth();
  const db = useDB();

  const { activeBatch } = useActiveBatch();
  const studyMaterials = db.studyMaterials?.filter(m => {
    const inBatch = m.batchId === activeBatch?.id;
    const notHidden = m.visibility !== 'Hidden';

    // Explicitly Targeted
    const isTargeted = (m.recipientType === 'selected' || m.recipientMode === 'selected') 
      ? (m.recipientIds || []).includes(studentProfile?.uid)
      : false;

    // Batch-wide (all)
    const isBatchWide = m.recipientType === 'all' || m.recipientMode === 'all' || m.visibility === 'Students' || m.visibility === 'Everyone' || (!m.recipientType && !m.recipientMode);

    // Historical Eligibility for Batch-wide
    const joinDate = studentProfile?.batchJoinDates?.[m.batchId] || '';
    const hasGrant = studentProfile?.grantedHistoricalBatches?.includes(m.batchId);
    const contentDate = m.uploadDate || m.createdAt || m.date || '';
    
    // Compare dates safely by comparing the YYYY-MM-DD prefix to prevent same-day time-suffix bugs
    const safeContentDate = contentDate.substring(0, 10);
    const safeJoinDate = joinDate.substring(0, 10);
    const isHistoricallyEligible = safeJoinDate === '' || hasGrant || (safeContentDate && safeContentDate >= safeJoinDate);

    // Final decision
    const isVisible = isTargeted || (isBatchWide && isHistoricallyEligible);

    return inBatch && notHidden && isVisible;
  }).sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime()) || [];

  useEffect(() => {
    if (studyMaterials.length > 0) {
      markContentRead(studyMaterials.map(m => m.id), studentProfile, 'materials');
    }
  }, [studyMaterials, studentProfile]);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">Study Materials</h2>
        <p className="text-slate-500 text-sm mt-1">Access notes, presentations, and resources for your batches.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {studyMaterials.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {activeBatch ? 'No study materials have been uploaded for this batch yet.' : 'No active batch assigned yet.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {studyMaterials.map(mat => {
              const batch = db.batches.find(b => b.id === mat.batchId);
              return (
              <div key={mat.id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-[#1763B6]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{mat.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {mat.type}
                      </span>
                      <span className="text-xs text-slate-500">{batch?.course}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {mat.uploadDate}
                      </span>
                    </div>
                  </div>
                </div>
                  {mat.type === 'Link' ? (
                    <a 
                      href={mat.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-[#1763B6] text-slate-700 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Link
                    </a>
                  ) : (
                    <button
                      onClick={() => downloadFile(mat.url, mat.fileName || mat.title)}
                      className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-[#1763B6] text-slate-700 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </button>
                  )}
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
