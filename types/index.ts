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
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string; // User ID (child)
  createdBy: string; // User ID (parent)
  dueDate?: string; // ISO string
  dueTime?: string; // ISO string or specific time string like '14:00'
  status: TaskStatus;
  type: TaskType;
  frequency: TaskFrequency;
  points?: number; // Optional reward points
  completedAt?: string;
  verifiedAt?: string;
  reminder?: boolean;
  timeWindow?: {
    start: string; // Format "HH:mm"
    end: string;   // Format "HH:mm"
  };
  evidenceUrl?: string;
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
