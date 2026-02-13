/**
 * Settings Context
 * Handles global settings, language, and app configuration
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { GlobalSettings, Language } from '../../types';
import { translate, createTranslator } from '../i18n';

interface SettingsContextType {
    globalSettings: GlobalSettings | null;
    language: Language;
    updateGlobalSettings: (settings: Partial<GlobalSettings>) => Promise<void>;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    getLocalDateString: (date?: Date) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
    children: React.ReactNode;
    globalSettings: GlobalSettings | null;
    onUpdateSettings: (settings: Partial<GlobalSettings>) => Promise<void>;
}

export const SettingsProvider = ({
    children,
    globalSettings,
    onUpdateSettings,
}: SettingsProviderProps) => {
    const [language, setLanguageState] = useState<Language>(
        globalSettings?.language || 'es'
    );

    // Update language when globalSettings changes
    React.useEffect(() => {
        if (globalSettings?.language) {
            setLanguageState(globalSettings.language);
        }
    }, [globalSettings?.language]);

    const updateGlobalSettings = useCallback(async (settings: Partial<GlobalSettings>) => {
        await onUpdateSettings(settings);
    }, [onUpdateSettings]);

    const setLanguage = useCallback(async (lang: Language) => {
        setLanguageState(lang);
        await updateGlobalSettings({ language: lang });
    }, [updateGlobalSettings]);

    // Translation function with parameter support
    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        let result = translate(language, key);

        // Replace parameters like {count}, {name}, etc.
        if (params) {
            for (const [param, value] of Object.entries(params)) {
                result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
            }
        }

        return result;
    }, [language]);

    // Helper: Local Date String YYYY-MM-DD (Timezone Aware)
    const getLocalDateString = useCallback((date: Date = new Date()): string => {
        try {
            const timeZone = globalSettings?.timezone || 'America/Chicago';
            return new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone,
            }).format(date);
        } catch {
            // Fallback if timezone invalid
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    }, [globalSettings?.timezone]);

    const value: SettingsContextType = {
        globalSettings,
        language,
        updateGlobalSettings,
        setLanguage,
        t,
        getLocalDateString,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export default SettingsContext;
