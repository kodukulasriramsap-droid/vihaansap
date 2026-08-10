import React, { useState, useEffect } from 'react';
import { LeadService } from '../../services/LeadService';
import { Lead, LeadStatus, LeadPriority } from '../../types';
import { 
  Search, Filter, MoreVertical, Edit2, Trash2, Mail, Phone, Clock, User, FileText, ChevronRight, X, UserPlus, CheckCircle
} from 'lucide-react';

type Tab = 'Dashboard' | 'All Leads' | 'Demo Requests' | 'General Enquiries' | 'Contact Messages' | 'Follow Ups' | 'Archived';

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  const loadLeads = () => {
    setLeads(LeadService.getLeads().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => {
    loadLeads();
    const handleDbUpdate = () => loadLeads();
    window.addEventListener('db_updated', handleDbUpdate);
    return () => window.removeEventListener('db_updated', handleDbUpdate);
  }, []);

  const handleUpdateStatus = (id: string, status: LeadStatus) => {
    LeadService.updateLead(id, { status });
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead({ ...selectedLead, status });
    }
    loadLeads();
  };

  const handleUpdatePriority = (id: string, priority: LeadPriority) => {
    LeadService.updateLead(id, { priority });
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead({ ...selectedLead, priority });
    }
    loadLeads();
  };

  const handleAddNote = () => {
    if (!selectedLead || !newNote.trim()) return;
    LeadService.addNote(selectedLead.id, 'Admin', newNote.trim());
    setNewNote('');
    // Refresh selected lead
    const updated = LeadService.getLead(selectedLead.id);
    if (updated) setSelectedLead(updated);
    loadLeads();
  };

  const openDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const getFilteredLeads = () => {
    let filtered = leads;
    
    if (activeTab === 'Demo Requests') {
      filtered = filtered.filter(l => l.source === 'Book Free Demo' && !l.isArchived);
    } else if (activeTab === 'General Enquiries') {
      filtered = filtered.filter(l => l.source.includes('Homepage') || l.source.includes('Corporate') && !l.isArchived);
    } else if (activeTab === 'Follow Ups') {
      filtered = filtered.filter(l => l.status === 'Follow Up' && !l.isArchived);
    } else if (activeTab === 'Archived') {
      filtered = filtered.filter(l => l.isArchived);
    } else if (activeTab === 'All Leads') {
      filtered = filtered.filter(l => !l.isArchived);
    }
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.email.toLowerCase().includes(q) || 
        l.phone.includes(q) ||
        (l.courseInterested && l.courseInterested.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  };

  const displayLeads = getFilteredLeads();

  // Dashboard Stats
  const activeLeads = leads.filter(l => !l.isArchived);
  const totalLeads = activeLeads.length;
  const demoRequests = activeLeads.filter(l => l.source === 'Book Free Demo').length;
  const pendingFollowups = activeLeads.filter(l => l.status === 'Follow Up').length;
  const converted = activeLeads.filter(l => l.status === 'Converted').length;

  const StatusBadge = ({ status }: { status: LeadStatus }) => {
    const colors: Record<LeadStatus, string> = {
      'New': 'bg-blue-100 text-blue-700',
      'Contacted': 'bg-yellow-100 text-yellow-700',
      'Follow Up': 'bg-orange-100 text-orange-700',
      'Interested': 'bg-indigo-100 text-indigo-700',
      'Demo Scheduled': 'bg-purple-100 text-purple-700',
      'Converted': 'bg-emerald-100 text-emerald-700',
      'Qualified': 'bg-indigo-100 text-indigo-700',
      'Lost': 'bg-slate-100 text-slate-700',
    };
    return <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[status]}`}>{status}</span>;
  };

  const PriorityBadge = ({ priority }: { priority: LeadPriority }) => {
    const colors: Record<LeadPriority, string> = {
      'Low': 'text-slate-500 bg-slate-100',
      'Medium': 'text-blue-600 bg-blue-50',
      'High': 'text-orange-600 bg-orange-50',
      'Urgent': 'text-red-600 bg-red-50',
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colors[priority]}`}>{priority}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">Lead Management</h2>
          <p className="text-slate-500 text-sm">Track, manage, and convert inquiries into students.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto space-x-2 border-b border-slate-200 pb-2 scrollbar-hide">
        {(['Dashboard', 'All Leads', 'Demo Requests', 'General Enquiries', 'Follow Ups', 'Archived'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Dashboard' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-slate-500 text-sm font-medium">Total Active Leads</span>
              <span className="text-3xl font-display font-bold text-slate-800 mt-2">{totalLeads}</span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-slate-500 text-sm font-medium">Demo Requests</span>
              <span className="text-3xl font-display font-bold text-indigo-600 mt-2">{demoRequests}</span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-slate-500 text-sm font-medium">Pending Follow-ups</span>
              <span className="text-3xl font-display font-bold text-orange-600 mt-2">{pendingFollowups}</span>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-slate-500 text-sm font-medium">Converted Students</span>
              <span className="text-3xl font-display font-bold text-emerald-600 mt-2">{converted}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search leads by name, email, phone, course..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50 focus:bg-white"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto justify-center">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Lead Info</th>
                    <th className="px-6 py-4">Course/Source</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayLeads.length > 0 ? displayLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openDrawer(lead)}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{lead.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                          <Mail className="w-3 h-3" /> {lead.email}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <Phone className="w-3 h-3" /> {lead.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#1763B6] text-xs bg-blue-50 px-2 py-1 rounded inline-block mb-1">{lead.courseInterested || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">{lead.source}</div>
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={lead.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">{new Date(lead.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-400">{new Date(lead.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer(lead);
                          }}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No leads found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      {isDrawerOpen && selectedLead && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-display font-bold text-lg text-slate-800">Lead Details</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
                  {selectedLead.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedLead.name}</h2>
                  <div className="text-sm text-slate-500 space-y-1 mt-2">
                    <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {selectedLead.email}</p>
                    <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {selectedLead.phone}</p>
                  </div>
                </div>
              </div>

              {/* Status & Priority Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                  <select 
                    value={selectedLead.status}
                    onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value as LeadStatus)}
                    className="w-full text-sm border border-slate-200 outline-none rounded-lg px-3 py-2 bg-white focus:border-indigo-500"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Interested">Interested</option>
                    <option value="Demo Scheduled">Demo Scheduled</option>
                    <option value="Converted">Converted</option>
                    <option value="Closed">Closed</option>
                    <option value="Spam">Spam</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</label>
                  <select 
                    value={selectedLead.priority}
                    onChange={(e) => handleUpdatePriority(selectedLead.id, e.target.value as LeadPriority)}
                    className="w-full text-sm border border-slate-200 outline-none rounded-lg px-3 py-2 bg-white focus:border-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Lead Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Course:</span>
                  <span className="col-span-2 font-medium text-slate-800">{selectedLead.courseInterested || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Source:</span>
                  <span className="col-span-2 font-medium text-slate-800">{selectedLead.source}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Submitted:</span>
                  <span className="col-span-2 font-medium text-slate-800">{new Date(selectedLead.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {selectedLead.message && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Original Message</label>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
                    {selectedLead.message}
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  Internal Notes
                  <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px]">{selectedLead.notes?.length || 0}</span>
                </label>
                
                <div className="space-y-3">
                  {selectedLead.notes?.map(note => (
                    <div key={note.id} className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                      <p className="text-sm text-slate-800 mb-2">{note.message}</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                        <span>{note.adminName}</span>
                        <span>{new Date(note.date).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  
                  {(!selectedLead.notes || selectedLead.notes.length === 0) && (
                    <p className="text-xs text-slate-400 italic text-center py-2">No internal notes yet.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Add a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 text-sm border border-slate-200 outline-none rounded-lg px-3 py-2 focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddNote();
                    }}
                  />
                  <button 
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* History Timeline */}
              {selectedLead.history && selectedLead.history.length > 0 && (
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Activity History</label>
                  <div className="relative pl-3 border-l-2 border-slate-100 space-y-4">
                    {selectedLead.history.slice().reverse().map((event, idx) => (
                      <div key={event.id || idx} className="relative">
                        <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 bg-slate-300 rounded-full border-2 border-white"></div>
                        <p className="text-xs font-semibold text-slate-800">{event.action}</p>
                        {event.details && <p className="text-[11px] text-slate-500 mt-0.5">{event.details}</p>}
                        <p className="text-[9px] text-slate-400 mt-1 font-medium">{new Date(event.date).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
            
            {/* Drawer Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <a 
                href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
              >
                WhatsApp
              </a>
              <button 
                onClick={() => {
                  const isArchived = selectedLead.isArchived;
                  LeadService.updateLead(selectedLead.id, { isArchived: !isArchived });
                  setSelectedLead(null);
                  setIsDrawerOpen(false);
                  loadLeads();
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  selectedLead.isArchived 
                    ? 'border-indigo-200 text-indigo-700 hover:bg-indigo-50' 
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {selectedLead.isArchived ? 'Unarchive' : 'Archive'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
