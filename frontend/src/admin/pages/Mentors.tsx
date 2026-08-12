import { useEffect, useState } from 'react';
import { BookOpen, Edit, Plus, Search, X } from 'lucide-react';
import { useDB } from '../../hooks/useDB';
import { MentorRecord, MentorService } from '../../services/MentorService';

const blank = (): Partial<MentorRecord> => ({ name: '', email: '', phone: '', photoURL: '', designation: '', assignedBatchIds: [], assignedCourseIds: [], status: 'active' });

export default function Mentors() {
  const database = useDB();
  const [mentors, setMentors] = useState<MentorRecord[]>([]);
  const [editing, setEditing] = useState<Partial<MentorRecord> | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => MentorService.subscribeAdmin(setMentors, err => setError(err.message)), []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing?.email) return;
    try { await MentorService.saveAdmin(editing as MentorRecord); setEditing(null); }
    catch (err: any) { setError(err.message || 'Unable to save mentor.'); }
  };

  const visible = mentors.filter(m => `${m.name} ${m.email}`.toLowerCase().includes(search.toLowerCase()));
  const toggleBatch = (id: string) => setEditing(current => current ? { ...current, assignedBatchIds: current.assignedBatchIds?.includes(id) ? current.assignedBatchIds.filter(x => x !== id) : [...(current.assignedBatchIds || []), id] } : current);
  const toggleCourse = (id: string) => setEditing(current => current ? { ...current, assignedCourseIds: current.assignedCourseIds?.includes(id) ? current.assignedCourseIds.filter(x => x !== id) : [...(current.assignedCourseIds || []), id] } : current);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div><h2 className="text-2xl font-bold text-slate-800">Mentors</h2><p className="text-sm text-slate-500">Admin-controlled mentor profiles, batch access, and course access.</p></div>
        <button onClick={() => setEditing(blank())} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="w-4 h-4" />Create Mentor</button>
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mentors" className="w-full rounded-lg border pl-9 py-2" /></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.map(m => (
          <article key={m.id} className="rounded-xl border bg-white p-5">
            <div className="flex justify-between"><div><h3 className="font-bold">{m.name || 'Profile pending'}</h3><p className="text-sm text-slate-500">{m.email}</p></div><span className={m.status === 'active' ? 'text-green-700 text-sm' : 'text-red-700 text-sm'}>{m.status}</span></div>
            <p className="mt-3 text-sm">{m.designation || 'No designation'}</p>
            <div className="mt-2 flex gap-4">
              <p className="text-xs text-slate-500">{m.assignedBatchIds?.length || 0} batch(es)</p>
              <p className="text-xs text-slate-500 flex items-center gap-1"><BookOpen className="w-3 h-3" />{m.assignedCourseIds?.length || 0} course(s)</p>
            </div>
            <button onClick={() => setEditing({ ...m, assignedCourseIds: m.assignedCourseIds || [] })} className="mt-4 flex items-center gap-1 text-sm text-indigo-700"><Edit className="w-4 h-4" />Edit</button>
          </article>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
          <form onSubmit={save} className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 space-y-4">
            <div className="flex justify-between"><h3 className="text-lg font-bold">Mentor profile</h3><button type="button" onClick={() => setEditing(null)}><X /></button></div>
            <div className="grid gap-4 md:grid-cols-2">
              {(['name', 'email', 'phone', 'photoURL', 'designation'] as const).map(field => (
                <label key={field} className="text-sm capitalize">{field}
                  <input required={field === 'email'} disabled={field === 'email' && mentors.some(m => m.id === editing.email)} value={editing[field] || ''} onChange={e => setEditing({ ...editing, [field]: e.target.value })} className="mt-1 w-full rounded border p-2 disabled:bg-slate-100" />
                </label>
              ))}
              <label className="text-sm">Status<select value={editing.status || 'active'} onChange={e => setEditing({ ...editing, status: e.target.value as 'active' | 'disabled' })} className="mt-1 w-full rounded border p-2"><option value="active">Active</option><option value="disabled">Disabled</option></select></label>
            </div>
            <fieldset><legend className="text-sm font-semibold">Assigned batches</legend>
              <div className="mt-2 grid gap-2 md:grid-cols-2">{database.batches.map(batch => <label key={batch.id} className="flex gap-2 text-sm"><input type="checkbox" checked={editing.assignedBatchIds?.includes(batch.id) || false} onChange={() => toggleBatch(batch.id)} />{batch.name}</label>)}</div>
            </fieldset>
            <fieldset className="border border-slate-200 rounded-lg p-4">
              <legend className="text-sm font-semibold px-1 flex items-center gap-1"><BookOpen className="w-4 h-4 text-indigo-600" />Assigned courses (course access)</legend>
              {database.courses.length === 0
                ? <p className="text-xs text-slate-400 mt-2">No courses found. Create courses in the Courses section first.</p>
                : <div className="mt-2 grid gap-2 md:grid-cols-2">{database.courses.map((course: any) => (
                  <label key={course.id} className="flex gap-2 text-sm items-start">
                    <input type="checkbox" className="mt-0.5" checked={editing.assignedCourseIds?.includes(course.id) || false} onChange={() => toggleCourse(course.id)} />
                    <span><span className="font-medium">{course.name}</span>{course.code && <span className="text-xs text-slate-400 ml-1">({course.code})</span>}</span>
                  </label>
                ))}</div>
              }
            </fieldset>
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Save mentor</button>
          </form>
        </div>
      )}
    </div>
  );
}
