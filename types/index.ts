export * from './history';
export type Role = 'parent' | 'child';

export type TaskType = 'obligatory' | 'additional';

export type TaskFrequency = 'daily' | 'weekly' | 'one-time';

export type TaskStatus = 'pending' | 'completed' | 'verified' | 'expired';

export interface User {
  id: string;
  name: string;
  role: Role;
  username: string;
  password?: string; // In a real app this would be hashed, or handled by Firebase Auth
  avatar?: string;
  color?: string; // Hex color code for identifying the user
  pushToken?: string;
}

export interface JustificationReason {
  id: string;
  text: string;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  type: TaskType;
  frequency: TaskFrequency;
  points: number;
  timeWindow?: {
    start: string;
    end: string;
  };
  timeLimit?: number;
  isResponsibility: boolean;
  isSchool: boolean;
  recurrenceDays?: number[];
  shift?: 'morning' | 'afternoon' | 'night' | 'no-time';
  categoryId?: string;
}

export interface Task {
  id: string;
  title: string; // From Template or Override
  description?: string; // From Template or Override
  assignedTo: string;
  createdBy: string;
  dueDate?: string;
  dueTime?: string; // Specific to day
  status: TaskStatus;
  type: TaskType; // From Template
  frequency: TaskFrequency; // From Template
  points?: number; // From Template
  completedAt?: string;
  verifiedAt?: string;
  reminder?: boolean;
  timeWindow?: {
    start: string;
    end: string;
  };
  timeLimit?: number;
  evidenceUrl?: string;
  isResponsibility?: boolean;
  isSchool?: boolean;
  recurrenceDays?: number[];
  shift?: 'morning' | 'afternoon' | 'night' | 'no-time';

  // Relational Link
  templateId?: string;
  originalTaskId?: string; // DEPRECATED: Use templateId
  categoryId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
  order: number;
}

export interface Reward {
  id: string;
  title: string;
  description?: string; // e.g. "Vale por 30 min de videojuego"
  cost: number; // Points required
  createdBy: string; // Parent ID
  icon?: string; // Emoji char
}

export interface Redemption {
  id: string;
  rewardId: string;
  rewardTitle: string;
  childId: string;
  cost: number;
  status: 'pending' | 'approved' | 'rejected'; // 'approved' means points are deducted and reward given
  requestDate: string; // ISO
  redeemedDate?: string; // ISO
}
export interface NonSchoolDay {
  date: string; // YYYY-MM-DD
  description?: string;
}

export type Language = 'es' | 'en' | 'fr' | 'pt' | 'it';

export interface GlobalSettings {
  id: string; // 'general'
  isVacationMode: boolean;
  nonSchoolDays?: NonSchoolDay[];
  timezone?: string; // e.g. 'America/Chicago'
  language?: Language;
}
