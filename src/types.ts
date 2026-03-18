export interface Lead {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  status: 'new' | 'researching' | 'evaluated' | 'contacted';
  userId: string;
  assignedToEmail?: string;
  assignedToUid?: string;
  createdByEmail?: string;
  createdAt: string;
}

export interface Research {
  id: string;
  leadId: string;
  platform: string;
  content: string;
  sourceUrl?: string;
  userId: string;
  createdByEmail?: string;
  createdAt: string;
}

export interface Criterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  leadId?: string;
  userId: string;
  createdByEmail?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdByEmail?: string;
}

export interface Evaluation {
  id: string;
  leadId: string;
  score: number;
  confidenceScore: number;
  insights: string;
  criteriaScores: Record<string, number>;
  userId: string;
  createdByEmail?: string;
  createdAt: string;
}

export interface SavedAsset {
  id: string;
  leadId: string;
  type: 'email' | 'deck';
  content: string;
  userId: string;
  createdByEmail?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  leadId: string;
  title: string;
  dueDate: string;
  status: 'todo' | 'in-progress' | 'done';
  userId: string;
  assignedToEmail?: string;
  assignedToUid?: string;
  createdByEmail?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  lastLogin: string;
}
