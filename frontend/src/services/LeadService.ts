import { MockDB } from './MockDB';
import { Lead } from '../types';

export class LeadService {
  static async saveLead(data: Partial<Lead>): Promise<Lead> {
    const newLead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name || 'Unknown',
      email: data.email || '',
      phone: data.phone || '',
      courseInterested: data.courseInterested || '',
      message: data.message || '',
      source: data.source || 'Website',
      status: 'New',
      priority: data.priority || 'Medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false,
      history: [{
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        action: 'Lead Created',
        details: `Source: ${data.source || 'Website'}`
      }],
      ...data
    } as Lead;

    MockDB.addItem('leads', newLead);
    return newLead;
  }

  static getLeads(): Lead[] {
    return MockDB.getCollection('leads') as Lead[];
  }

  static getLead(id: string): Lead | undefined {
    return this.getLeads().find(l => l.id === id);
  }

  static updateLead(id: string, updates: Partial<Lead>): void {
    const lead = this.getLead(id);
    if (!lead) return;

    // Record history if status changed
    if (updates.status && updates.status !== lead.status) {
      const historyEvent = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        action: 'Status Changed',
        details: `Status changed from ${lead.status} to ${updates.status}`
      };
      updates.history = [...(lead.history || []), historyEvent];
    }

    updates.updatedAt = new Date().toISOString();
    MockDB.updateItem('leads', id, updates);
  }

  static deleteLead(id: string): void {
    MockDB.deleteItem('leads', id);
  }

  static addNote(id: string, adminName: string, message: string): void {
    const lead = this.getLead(id);
    if (!lead) return;

    const newNoteStr = `[${new Date().toISOString().split('T')[0]}] ${adminName}: ${message}`;

    const historyEvent = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      action: 'Note Added',
      details: `Added by ${adminName}`
    };

    const updates: any = {
      notes: lead.notes ? lead.notes + '\n' + newNoteStr : newNoteStr,
      history: [...((lead as any).history || []), historyEvent],
      updatedAt: new Date().toISOString()
    };

    MockDB.updateItem('leads', id, updates);
  }
}
