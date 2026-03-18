export interface Lead {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  status: 'new' | 'researching' | 'evaluated' | 'contacted';
  userId: string;
  createdAt: string;
}

export interface Research {
  id: string;
  leadId: string;
  platform: string;
  content: string;
  sourceUrl?: string;
  userId: string;
  createdAt: string;
}

export interface Criterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  leadId?: string;
  userId: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  userId: string;
}

export interface Evaluation {
  id: string;
  leadId: string;
  score: number;
  confidenceScore: number;
  insights: string;
  criteriaScores: Record<string, number>;
  userId: string;
  createdAt: string;
}
