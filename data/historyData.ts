import { TaskHistory } from '../types';

export const MOCK_HISTORY: TaskHistory[] = [
    {
        id: 'h1',
        taskId: '1',
        taskTitle: 'Lavarse los dientes (Desayuno)',
        assignedTo: 'child1',
        points: 5,
        status: 'verified',
        date: '2023-12-20',
        completedAt: '2023-12-20T09:15:00Z'
    },
    {
        id: 'h2',
        taskId: '1',
        taskTitle: 'Lavarse los dientes (Desayuno)',
        assignedTo: 'child1',
        points: 5,
        status: 'missed',
        date: '2023-12-21',
    },
    {
        id: 'h3',
        taskId: '1',
        taskTitle: 'Lavarse los dientes (Desayuno)',
        assignedTo: 'child1',
        points: 5,
        status: 'verified',
        date: '2023-12-22',
        completedAt: '2023-12-22T09:05:00Z'
    }
];
