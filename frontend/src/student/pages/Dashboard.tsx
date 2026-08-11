import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Video, FileText, HelpCircle, MonitorPlay, CheckCircle, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDB } from '../../hooks/useDB';
import { useActiveBatch } from '../contexts/ActiveBatchContext';
import { isTargetedToStudent } from '../../utils/recipientTargeting';
import { isContentRead } from '../../utils/contentReadState';
import CourseRatingModal from './CourseRatingModal';

export default function Dashboard() {
  const { currentUser, studentProfile } = useAuth();
  const db = useDB();
  const { activeBatch, enrolledBatches } = useActiveBatch();
  const [activeReviewModal, setActiveReviewModal] = useState<{campaignId: string; batch: any} | null>(null);

  if (studentProfile?.status === 'Pending') {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center min-h-[70vh]">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full text-center border border-slate-100 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative z-10">
            <CheckCircle className="w-10 h-10 text-[#1763B6]" />
          </div>
          <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight relative z-10 mb-3">
            Registration Successful
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed relative z-10 mb-2">
            Your account has been created successfully.
          </p>
          <p className="text-slate-500 text-sm leading-relaxed relative z-10 mb-8">
            Our team will verify your enrollment and assign your purchased course or batch.
            Once assigned, your learning dashboard will automatically become available.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 1. Calculate Unread States for Navigation Cards
  // ---------------------------------------------------------

  // Live Classes
  const mySessions = db.batchSessions?.filter(s => enrolledBatches.some(b => b.id === s.batchId) && isTargetedToStudent(s, studentProfile)) || [];
  const hasNewLiveClasses = mySessions.some(s => 
    (s.status === 'Upcoming' || s.status === 'Live') && 
    !isContentRead(s.id, studentProfile, 'sessions')
  );

  // Recorded Classes
  const standaloneRecordings = db.recordings?.filter(r => 
    enrolledBatches.some(b => b.id === r.batchId) && r.visibility !== 'Hidden' && isTargetedToStudent(r, studentProfile)
  ) || [];
  const sessionRecordings = mySessions.filter(s => s.status === 'Completed' && s.recordingUrl);
  const allRecordings = [...standaloneRecordings, ...sessionRecordings];
  const hasNewRecordings = allRecordings.some(r => !isContentRead(r.id, studentProfile, 'recordings'));

  // Study Materials
  const studyMaterials = db.studyMaterials?.filter(m => 
    enrolledBatches.some(b => b.id === m.batchId) && m.visibility !== 'Hidden' && isTargetedToStudent(m, studentProfile)
  ) || [];
  const hasNewMaterials = studyMaterials.some(m => !isContentRead(m.id, studentProfile, 'materials'));

  // Doubt Support (Check for new replies from Mentor/Admin)
  const myDoubts = db.doubts?.filter(d => d.studentId === studentProfile?.id) || [];
  const myDoubtIds = myDoubts.map(d => d.id);
  const unreadDoubtReplies = db.doubtReplies?.filter(r => 
    myDoubtIds.includes(r.doubtId) && 
    r.role !== 'Student' && 
    !isContentRead(r.id, studentProfile, 'doubts')
  ) || [];
  const hasNewDoubtReplies = unreadDoubtReplies.length > 0;


  // ---------------------------------------------------------
  // 2. Review Requests (Important to keep for campaigns)
  // ---------------------------------------------------------
  const pendingReviewRequests = (db.notifications || [])
    .map((notification: any) => {
      const campaign = (db.reviewCampaigns || []).find((item: any) => item.id === notification.targetId);
      return {
        notification,
        campaign,
        batchId: campaign?.batchId || notification.batchId,
        name: campaign?.name || notification.campaignName || notification.title?.replace(/^Feedback Request:\s*/, '') || 'Feedback Request',
      };
    })
    .filter(({ notification, campaign }: any) => {
      if (notification.type !== 'review_campaign') return false;
      if (campaign ? campaign.status !== 'Active' : notification.reviewRequestStatus === 'Closed') return false;
      if (!isTargetedToStudent(notification, studentProfile)) return false;
      if (campaign && !isTargetedToStudent(campaign, studentProfile)) return false;
      return !(db.reviews || []).some((review: any) =>
        review.campaignId === notification.targetId &&
        (review.studentUid === currentUser?.uid || review.studentId === studentProfile?.id || review.studentId === currentUser?.uid)
      );
    });

  // ---------------------------------------------------------
  // Navigation Card Component
  // ---------------------------------------------------------
  const NavCard = ({ title, description, icon: Icon, to, hasNew, colorClass, bgClass }: any) => (
    <Link to={to} className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 block overflow-hidden">
      <div className="flex items-start gap-4 relative z-10">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass} transition-transform group-hover:scale-110`}>
          <Icon className="w-7 h-7" />
        </div>
        <div className="flex-1 pt-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-800 text-lg group-hover:text-[#1763B6] transition-colors">{title}</h3>
            {hasNew && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
      <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${bgClass} group-hover:opacity-40 transition-opacity`}></div>
    </Link>
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-6xl mx-auto">
      
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-[#1763B6] to-[#0A3D7A] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight mb-2">
            Welcome to Your Learning Space,
            <br />
            <span className="text-blue-200">{studentProfile?.name || currentUser?.displayName || 'Student'}!</span>
          </h2>
          <p className="text-blue-100 max-w-2xl text-lg mt-4 font-medium">
            {activeBatch ? (
              <>Current Batch: <span className="font-bold text-white bg-white/20 px-3 py-1 rounded-lg ml-1">{activeBatch.name}</span></>
            ) : (
              'Ready to continue your learning journey?'
            )}
          </p>
        </div>
      </div>

      {/* Review Requests */}
      {pendingReviewRequests.length > 0 && (
        <section className="space-y-4">
          {pendingReviewRequests.map(({ notification: n, campaign, batchId, name }: any) => {
            const batchForCampaign = (db.batches || []).find((batch: any) => batch.id === batchId) || { id: batchId, course: campaign?.course || 'Assigned Course' };
            return (
              <div key={n.targetId} className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0 shadow-inner">
                    <Star className="w-6 h-6 text-red-600 fill-red-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-900 text-lg flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                      Review Pending: {name}
                    </h3>
                    <p className="text-sm text-red-800 mt-1 max-w-2xl">{n.message || 'Your mentor has requested you to share your learning experience.'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveReviewModal({ campaignId: n.targetId, batch: batchForCampaign })}
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5 shrink-0"
                >
                  Submit Review
                </button>
              </div>
            );
          })}
        </section>
      )}

      {/* Main Navigation Grid */}
      <div>
        <h3 className="text-xl font-display font-bold text-slate-800 mb-6 flex items-center gap-2">
          <MonitorPlay className="w-5 h-5 text-[#1763B6]" /> Quick Access
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NavCard 
            title="Live Classes" 
            description="Join your upcoming live learning sessions."
            icon={MonitorPlay}
            to="/student/course-calendar"
            hasNew={hasNewLiveClasses}
            bgClass="bg-blue-50"
            colorClass="text-blue-600"
          />
          <NavCard 
            title="Recorded Classes" 
            description="Watch previously recorded sessions anytime."
            icon={Video}
            to="/student/recordings"
            hasNew={hasNewRecordings}
            bgClass="bg-indigo-50"
            colorClass="text-indigo-600"
          />
          <NavCard 
            title="Study Materials" 
            description="Access notes, resources and learning materials."
            icon={FileText}
            to="/student/materials"
            hasNew={hasNewMaterials}
            bgClass="bg-emerald-50"
            colorClass="text-emerald-600"
          />
          <NavCard 
            title="Doubt Support" 
            description="Ask questions and get support from your mentor."
            icon={HelpCircle}
            to="/student/doubts"
            hasNew={hasNewDoubtReplies}
            bgClass="bg-orange-50"
            colorClass="text-orange-600"
          />
        </div>
      </div>

      {activeReviewModal && (
        <CourseRatingModal
          isOpen={true}
          onClose={() => setActiveReviewModal(null)}
          courseName={activeReviewModal.batch.course}
          campaignId={activeReviewModal.campaignId}
          studentId={studentProfile?.id}
          studentName={studentProfile?.name}
          studentEmail={studentProfile?.email}
        />
      )}
    </div>
  );
}
