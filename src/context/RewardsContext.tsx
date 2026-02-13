/**
 * Rewards Context
 * Handles rewards, redemptions, and point-based transactions
 */

import React, { createContext, useContext, useCallback } from 'react';
import { Reward, Redemption, TaskHistory, User } from '../../types';

interface RewardsContextType {
    rewards: Reward[];
    redemptions: Redemption[];
    addReward: (reward: Omit<Reward, 'id'>) => Promise<void>;
    updateReward: (rewardId: string, updates: Partial<Reward>) => Promise<void>;
    deleteReward: (rewardId: string) => Promise<void>;
    redeemReward: (redemption: Omit<Redemption, 'id' | 'requestDate' | 'status'>) => Promise<void>;
    approveRedemption: (redemptionId: string) => Promise<void>;
    rejectRedemption: (redemptionId: string) => Promise<void>;
    getChildPoints: (childId: string, history: TaskHistory[]) => number;
}

const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

interface RewardsProviderProps {
    children: React.ReactNode;
    rewards: Reward[];
    redemptions: Redemption[];
    onAddReward: (reward: Omit<Reward, 'id'>) => Promise<void>;
    onUpdateReward: (rewardId: string, updates: Partial<Reward>) => Promise<void>;
    onDeleteReward: (rewardId: string) => Promise<void>;
    onRedeemReward: (redemption: Omit<Redemption, 'id' | 'requestDate' | 'status'>) => Promise<void>;
    onApproveRedemption: (redemptionId: string) => Promise<void>;
    onRejectRedemption: (redemptionId: string) => Promise<void>;
    onAddHistory: (entry: Omit<TaskHistory, 'id'>) => Promise<void>;
}

export const RewardsProvider = ({
    children,
    rewards,
    redemptions,
    onAddReward,
    onUpdateReward,
    onDeleteReward,
    onRedeemReward,
    onApproveRedemption,
    onRejectRedemption,
}: RewardsProviderProps) => {

    const addReward = useCallback(async (reward: Omit<Reward, 'id'>) => {
        await onAddReward(reward);
    }, [onAddReward]);

    const updateReward = useCallback(async (rewardId: string, updates: Partial<Reward>) => {
        await onUpdateReward(rewardId, updates);
    }, [onUpdateReward]);

    const deleteReward = useCallback(async (rewardId: string) => {
        await onDeleteReward(rewardId);
    }, [onDeleteReward]);

    const redeemReward = useCallback(async (
        redemption: Omit<Redemption, 'id' | 'requestDate' | 'status'>
    ) => {
        await onRedeemReward(redemption);
    }, [onRedeemReward]);

    const approveRedemption = useCallback(async (redemptionId: string) => {
        await onApproveRedemption(redemptionId);
    }, [onApproveRedemption]);

    const rejectRedemption = useCallback(async (redemptionId: string) => {
        await onRejectRedemption(redemptionId);
    }, [onRejectRedemption]);

    /**
     * Calculate total points for a child based on history
     */
    const getChildPoints = useCallback((childId: string, history: TaskHistory[]): number => {
        return history
            .filter(h => h.assignedTo === childId && h.status === 'verified')
            .reduce((sum, h) => sum + (h.points || 0), 0);
    }, []);

    const value: RewardsContextType = {
        rewards,
        redemptions,
        addReward,
        updateReward,
        deleteReward,
        redeemReward,
        approveRedemption,
        rejectRedemption,
        getChildPoints,
    };

    return (
        <RewardsContext.Provider value={value}>
            {children}
        </RewardsContext.Provider>
    );
};

export const useRewards = (): RewardsContextType => {
    const context = useContext(RewardsContext);
    if (context === undefined) {
        throw new Error('useRewards must be used within a RewardsProvider');
    }
    return context;
};

export default RewardsContext;
