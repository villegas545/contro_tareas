/**
 * useRewards Hook - Rewards and redemptions logic
 */
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Reward, Redemption, TaskHistory } from '../types';
import { isTestMode } from './types';

interface UseRewardsParams {
    rewards: Reward[];
    setRewards: React.Dispatch<React.SetStateAction<Reward[]>>;
    redemptions: Redemption[];
    setRedemptions: React.Dispatch<React.SetStateAction<Redemption[]>>;
    history: TaskHistory[];
    setHistory: React.Dispatch<React.SetStateAction<TaskHistory[]>>;
    getLocalDateString: (date?: Date) => string;
}

export const useRewards = ({
    rewards,
    setRewards,
    redemptions,
    setRedemptions,
    history,
    setHistory,
    getLocalDateString,
}: UseRewardsParams) => {

    const addReward = async (reward: Omit<Reward, 'id'>) => {
        if (isTestMode()) {
            // @ts-ignore
            setRewards(prev => [...prev, { id: Date.now().toString(), ...reward }]);
            return;
        }
        await addDoc(collection(db, "rewards"), reward);
    };

    const deleteReward = async (rewardId: string) => {
        if (isTestMode()) {
            setRewards(prev => prev.filter(r => r.id !== rewardId));
            return;
        }
        await deleteDoc(doc(db, "rewards", rewardId));
    };

    const redeemReward = async (redemption: Omit<Redemption, 'id' | 'requestDate' | 'status'>) => {
        if (isTestMode()) {
            // @ts-ignore
            setRedemptions(prev => [...prev, {
                id: Date.now().toString(),
                ...redemption,
                status: 'pending',
                requestDate: new Date().toISOString()
            }]);
            return;
        }

        await addDoc(collection(db, "redemptions"), {
            ...redemption,
            status: 'pending',
            requestDate: new Date().toISOString()
        });
    };

    const approveRedemption = async (redemptionId: string) => {
        if (isTestMode()) {
            setRedemptions(prev => prev.map(r => r.id === redemptionId ? { ...r, status: 'approved', redeemedDate: new Date().toISOString() } : r));
            const r = redemptions.find(x => x.id === redemptionId);
            if (r) {
                // @ts-ignore
                setHistory(prev => [...prev, {
                    id: Date.now().toString(),
                    taskId: 'redemption-' + r.id,
                    taskTitle: `Canje: ${r.rewardTitle}`,
                    assignedTo: r.childId,
                    points: -Math.abs(r.cost),
                    status: 'verified',
                    date: getLocalDateString(),
                    completedAt: new Date().toISOString()
                }]);
            }
            return;
        }

        const redemption = redemptions.find(r => r.id === redemptionId);
        if (!redemption || redemption.status !== 'pending') return;

        await addDoc(collection(db, "history"), {
            taskId: 'redemption-' + redemptionId,
            taskTitle: `Canje: ${redemption.rewardTitle}`,
            assignedTo: redemption.childId,
            points: -Math.abs(redemption.cost),
            status: 'verified',
            date: getLocalDateString(),
            completedAt: new Date().toISOString()
        });

        await updateDoc(doc(db, "redemptions", redemptionId), {
            status: 'approved',
            redeemedDate: new Date().toISOString()
        });
    };

    const rejectRedemption = async (redemptionId: string) => {
        if (isTestMode()) {
            setRedemptions(prev => prev.map(r => r.id === redemptionId ? { ...r, status: 'rejected' } : r));
            return;
        }
        await updateDoc(doc(db, "redemptions", redemptionId), { status: 'rejected' });
    };

    return {
        addReward,
        deleteReward,
        redeemReward,
        approveRedemption,
        rejectRedemption,
    };
};
