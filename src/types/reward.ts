/**
 * Reward Types
 * Reward and redemption type definitions
 */

export type RedemptionStatus = 'pending' | 'approved' | 'rejected';

export interface Reward {
    id: string;
    title: string;
    description?: string;
    cost: number; // Points required
    createdBy: string;
    icon?: string; // Emoji
}

export interface Redemption {
    id: string;
    rewardId: string;
    rewardTitle: string;
    childId: string;
    cost: number;
    status: RedemptionStatus;
    requestDate: string;  // ISO datetime
    redeemedDate?: string; // ISO datetime
}
