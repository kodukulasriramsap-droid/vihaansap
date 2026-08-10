import React from 'react';
import { Users, UserCog, BookOpen, Layers, MonitorPlay, HelpCircle, FileText, Star, Inbox } from 'lucide-react';
import { useDB } from '../../hooks/useDB';

export default function Dashboard() {
  const db = useDB();

  const stats = [
    { name: 'Total Leads', value: db.leads?.filter(l => !l.isArchived).length || 0, icon: Inbox, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Total Students', value: db.students.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Mentors', value: db.mentors.length, icon: UserCog, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Courses', value: db.courses.length, icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Running Batches', value: db.batches.filter(b => b.status === 'Running').length, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Upcoming Classes', value: db.schedules.filter(s => s.status === 'Upcoming').length, icon: MonitorPlay, color: 'text-pink-600', bg: 'bg-pink-50' },
    { name: 'Pending Doubts', value: db.doubts.length, icon: HelpCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { name: 'Pending Reviews', value: db.reviews.length, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  const recentLeads = [...(db.leads || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">Dashboard Overview</h2>
        <p className="text-slate-500 text-sm mt-1">High-level metrics and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.name}</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Recent Leads</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recentLeads.length > 0 ? recentLeads.map(lead => (
              <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-800">{lead.name}</p>
                  <p className="text-xs text-slate-500">{lead.email}</p>
                </div>
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  lead.status === 'New' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  {lead.status}
                </span>
              </div>
            )) : (
              <div className="p-6 text-center text-slate-500 text-sm">No recent leads.</div>
            )}
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Recent Registrations</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {db.students.slice(0, 5).map(student => (
              <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-800">{student.name}</p>
                  <p className="text-xs text-slate-500">{student.email}</p>
                </div>
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  student.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  {student.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
