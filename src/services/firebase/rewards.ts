/**
 * Firebase Rewards Service
 * Encapsulates all Firebase operations for rewards and redemptions
 */

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { Reward, Redemption, TaskHistory } from '../../types';

export const rewardsService = {
    /**
     * Subscribe to rewards collection
     */
    subscribeRewards(callback: (rewards: Reward[]) => void): Unsubscribe {
        return onSnapshot(collection(db, "rewards"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
            callback(list);
        });
    },

    /**
     * Subscribe to redemptions collection
     */
    subscribeRedemptions(callback: (redemptions: Redemption[]) => void): Unsubscribe {
        return onSnapshot(collection(db, "redemptions"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Redemption));
            callback(list);
        });
    },

    /**
     * Add a new reward
     */
    async addReward(reward: Omit<Reward, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, "rewards"), reward);
        return docRef.id;
    },

    /**
     * Update a reward
     */
    async updateReward(rewardId: string, updates: Partial<Reward>): Promise<void> {
        await updateDoc(doc(db, "rewards", rewardId), updates);
    },

    /**
     * Delete a reward
     */
    async deleteReward(rewardId: string): Promise<void> {
        await deleteDoc(doc(db, "rewards", rewardId));
    },

    /**
     * Request a redemption
     */
    async redeemReward(redemption: Omit<Redemption, 'id' | 'requestDate' | 'status'>): Promise<string> {
        const docRef = await addDoc(collection(db, "redemptions"), {
            ...redemption,
            status: 'pending',
            requestDate: new Date().toISOString(),
        });
        return docRef.id;
    },

    /**
     * Approve a redemption (also adds negative points to history)
     */
    async approveRedemption(
        redemptionId: string,
        redemption: Redemption
    ): Promise<void> {
        // Add negative points history entry
        await addDoc(collection(db, "history"), {
            taskId: 'redemption-' + redemptionId,
            taskTitle: `Canje: ${redemption.rewardTitle}`,
            assignedTo: redemption.childId,
            points: -Math.abs(redemption.cost),
            status: 'verified',
            date: new Date().toISOString().split('T')[0],
            completedAt: new Date().toISOString(),
        });

        // Update redemption status
        await updateDoc(doc(db, "redemptions", redemptionId), {
            status: 'approved',
            redeemedDate: new Date().toISOString(),
        });
    },

    /**
     * Reject a redemption
     */
    async rejectRedemption(redemptionId: string): Promise<void> {
        await updateDoc(doc(db, "redemptions", redemptionId), {
            status: 'rejected'
        });
    },
};

export default rewardsService;
