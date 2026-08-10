export interface Lead {
  [key: string]: any;
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  source: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost' | 'Converted' | 'Follow Up' | 'Interested' | 'Demo Scheduled';
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  notes?: any[];
  date: string;
  assignedTo?: string;
  createdAt?: string;
  isArchived?: boolean;
  courseInterested?: string;
  message?: string;
  history?: any[];
  updatedAt?: string;
}

export type LeadStatus = Lead['status'];
export type LeadPriority = Lead['priority'];
