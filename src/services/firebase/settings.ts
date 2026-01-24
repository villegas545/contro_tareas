/**
 * Firebase Settings Service
 * Encapsulates all Firebase operations for app settings
 */

import {
    doc,
    setDoc,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { GlobalSettings } from '../../types';

const SETTINGS_DOC_ID = 'general';

export const settingsService = {
    /**
     * Subscribe to settings document
     */
    subscribeSettings(callback: (settings: GlobalSettings | null) => void): Unsubscribe {
        return onSnapshot(doc(db, "settings", SETTINGS_DOC_ID), (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as GlobalSettings;
                callback(data);
            } else {
                // Return default settings if document doesn't exist
                callback({
                    id: SETTINGS_DOC_ID,
                    isVacationMode: false,
                    language: 'es'
                });
            }
        });
    },

    /**
     * Update settings (merge)
     */
    async updateSettings(settings: Partial<GlobalSettings>): Promise<void> {
        await setDoc(doc(db, "settings", SETTINGS_DOC_ID), settings, { merge: true });
    },
};

export default settingsService;
