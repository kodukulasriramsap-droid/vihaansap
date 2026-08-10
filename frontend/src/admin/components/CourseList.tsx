import React, { useState } from 'react';
import { Edit2, Trash2, Copy, Search, Filter, Image as ImageIcon } from 'lucide-react';
import { useDB } from '../../hooks/useDB';
import { MockDB } from '../../services/MockDB';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface CourseListProps {
  onEdit: (course: any) => void;
  onDuplicate: (course: any) => void;
  onDelete: (id: string) => void;
}

export default function CourseList({ onEdit, onDuplicate, onDelete }: CourseListProps) {
  const db = useDB();
  const [search, setSearch] = useState('');

  const filtered = db.courses.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newCourses = [...db.courses];
    const temp = newCourses[index];
    newCourses[index] = newCourses[index - 1];
    newCourses[index - 1] = temp;
    MockDB.updateCollection('courses', newCourses);
  };

  const moveDown = (index: number) => {
    if (index === db.courses.length - 1) return;
    const newCourses = [...db.courses];
    const temp = newCourses[index];
    newCourses[index] = newCourses[index + 1];
    newCourses[index + 1] = temp;
    MockDB.updateCollection('courses', newCourses);
  };

  const getActiveBatches = (courseName: string) => {
    return db.batches.filter(b => b.course === courseName && b.status !== 'Completed').length;
  };

  const getStudentsCount = (courseName: string) => {
    return db.students.filter(s => s.course === courseName).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">Courses</h2>
          <p className="text-slate-500 text-sm mt-1">Manage all curriculum and course data.</p>
        </div>
        <button 
          onClick={() => onEdit({})}
          className="bg-[#1763B6] hover:bg-[#277EDC] text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
        >
          Add New Course
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search courses..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1763B6] bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Batches</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Students</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(course => (
                <tr key={course.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-800">{course.name}</p>
                        <p className="text-xs text-slate-500">{course.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${course.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {course.status || 'Published'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {getActiveBatches(course.name)} Active
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {getStudentsCount(course.name)}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {course.updatedAt || 'Just now'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => onEdit(course)} className="p-2 text-slate-400 hover:text-[#1763B6] rounded-lg hover:bg-blue-50" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDuplicate(course)} className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50" title="Duplicate">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(course.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No courses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
