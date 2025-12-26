
export interface TaskHistory {
    id: string;
    taskId: string;
    taskTitle: string;
    assignedTo: string;
    points: number;
    status: 'completed' | 'missed' | 'verified';
    date: string; // ISO Date (YYYY-MM-DD)
    completedAt?: string;
}
