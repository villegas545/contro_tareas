/**
 * Settings Types
 * Global settings and configuration type definitions
 */

export type Language = 'es' | 'en' | 'fr' | 'pt' | 'it';

export interface NonSchoolDay {
    date: string; // YYYY-MM-DD
    description?: string;
}

export interface GlobalSettings {
    id: string; // 'general'
    isVacationMode: boolean;
    nonSchoolDays?: NonSchoolDay[];
    timezone?: string; // e.g. 'America/Chicago'
    language?: Language;
}
