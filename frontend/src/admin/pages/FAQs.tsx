import React, { useState } from 'react';
import { useDB } from '../../hooks/useDB';
import { MockDB } from '../../services/MockDB';
import { Plus, Edit2, Trash2, X, CheckCircle, XCircle } from 'lucide-react';

export default function FAQs() {
  const db = useDB();
  const [editingFAQ, setEditingFAQ] = useState<any>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFAQ.id) {
      MockDB.updateItem('faqs', editingFAQ.id, editingFAQ);
    } else {
      MockDB.addItem('faqs', { ...editingFAQ, id: Date.now().toString() });
    }
    setEditingFAQ(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      MockDB.deleteItem('faqs', id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">FAQ CMS</h2>
          <p className="text-slate-500 text-sm mt-1">Manage public frequently asked questions.</p>
        </div>
        <button 
          onClick={() => setEditingFAQ({ question: '', answer: '', category: 'General' })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Question</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Answer</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {db.faqs.map(faq => (
              <tr key={faq.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-800">{faq.question}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 max-w-lg truncate">{faq.answer}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => setEditingFAQ(faq)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(faq.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingFAQ && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{editingFAQ.id ? 'Edit FAQ' : 'Create FAQ'}</h3>
              <button onClick={() => setEditingFAQ(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form id="faq-form" onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Question</label>
                  <input required type="text" value={editingFAQ.question || ''} onChange={e => setEditingFAQ({...editingFAQ, question: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Answer</label>
                  <textarea required rows={6} value={editingFAQ.answer || ''} onChange={e => setEditingFAQ({...editingFAQ, answer: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setEditingFAQ(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200">Cancel</button>
              <button type="submit" form="faq-form" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Save FAQ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
