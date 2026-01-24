/**
 * User Types
 * User and role-related type definitions
 */

export type Role = 'parent' | 'child';

export interface User {
    id: string;
    name: string;
    role: Role;
    username: string;
    password?: string; // In a real app this would be hashed
    avatar?: string;
    color?: string; // Hex color code for identifying the user
    pushToken?: string;
}
