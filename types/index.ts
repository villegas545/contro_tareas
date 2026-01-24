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

// 3-Table Architecture Interfaces

// 1. Template (Defined above as TaskTemplate)

// 2. Schedule (The Master Assignment)
export interface TaskSchedule {
  id: string;
  templateId: string; // Link to Template
  assignedTo: string; // Child ID
  createdBy: string;

  // Copied from Template but overrideable
  title: string;
  description?: string;
  type: TaskType;
  frequency: TaskFrequency;
  points: number;
  isResponsibility: boolean;
  isSchool: boolean;
  recurrenceDays?: number[]; // [1, 3, 5] for Mon,Wed,Fri
  timeWindow?: {
    start: string;
    end: string;
  };
  shift?: 'morning' | 'afternoon' | 'night' | 'no-time';
  categoryId?: string;

  active: boolean; // Easier to pause assignments without deleting
  createdAt: string;
}

// 3. Task (The Daily Instance)
export interface Task {
  id: string;
  scheduleId?: string; // Link to Schedule (if recurring)
  templateId?: string; // Link to Template (if one-off)

  assignedTo: string;
  title: string;
  description?: string;
  points: number;
  status: TaskStatus;

  dueDate: string; // YYYY-MM-DD
  dueTime?: string;

  // Metadata
  type: TaskType;
  frequency: TaskFrequency;
  isResponsibility?: boolean;
  isSchool?: boolean;
  categoryId?: string;
  shift?: 'morning' | 'afternoon' | 'night' | 'no-time';

  // Execution constraints
  timeWindow?: {
    start: string;
    end: string;
  };
  timeLimit?: number;

  // Execution Data
  completedAt?: string;
  verifiedAt?: string;
  evidenceUrl?: string;

  // Legacy fields support (optional during migration)
  originalTaskId?: string;
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
