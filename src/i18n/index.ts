/**
 * i18n Configuration
 * Centralized internationalization setup
 */

import esTranslations from './locales/es.json';
import enTranslations from './locales/en.json';

export type Language = 'es' | 'en' | 'fr' | 'pt' | 'it';

// Type for a single translation file
type TranslationFile = typeof esTranslations;

// All translations
const translations: Record<Language, TranslationFile> = {
    es: esTranslations,
    en: enTranslations,
    // Add other languages as needed
    fr: esTranslations, // Fallback to Spanish for now
    pt: esTranslations, // Fallback to Spanish for now
    it: esTranslations, // Fallback to Spanish for now
};

/**
 * Get nested value from object using dot notation
 * @param obj - Object to search
 * @param path - Dot-separated path (e.g., 'common.save')
 */
const getNestedValue = (obj: Record<string, unknown>, path: string): string | undefined => {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return undefined;
        }
        current = (current as Record<string, unknown>)[key];
    }

    return typeof current === 'string' ? current : undefined;
};

/**
 * Flatten nested object to dot notation keys
 * This allows compatibility with the old translation key format
 */
const flattenTranslations = (obj: Record<string, unknown>, prefix = ''): Record<string, string> => {
    const result: Record<string, string> = {};

    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, flattenTranslations(value as Record<string, unknown>, newKey));
        } else if (typeof value === 'string') {
            result[newKey] = value;
        }
    }

    return result;
};

// Pre-flatten translations for faster lookups with old-style keys
const flattenedTranslations: Record<Language, Record<string, string>> = {
    es: flattenTranslations(esTranslations),
    en: flattenTranslations(enTranslations),
    fr: flattenTranslations(esTranslations),
    pt: flattenTranslations(esTranslations),
    it: flattenTranslations(esTranslations),
};

/**
 * Get translation for a key
 * Supports both dot notation ('common.save') and old-style keys
 * @param lang - Language code
 * @param key - Translation key
 * @returns Translated string or the key if not found
 */
export const translate = (lang: Language, key: string): string => {
    // Try flattened first (faster for old-style keys)
    const flattened = flattenedTranslations[lang] || flattenedTranslations.es;
    if (flattened[key]) {
        return flattened[key];
    }

    // Try nested lookup
    const langTranslations = translations[lang] || translations.es;
    const nested = getNestedValue(langTranslations as Record<string, unknown>, key);
    if (nested) {
        return nested;
    }

    // Fallback to Spanish
    const esFallback = flattenedTranslations.es[key];
    if (esFallback) {
        return esFallback;
    }

    // Return key as last resort
    return key;
};

/**
 * Create a translation function for a specific language
 */
export const createTranslator = (lang: Language) => {
    return (key: string, params?: Record<string, string | number>): string => {
        let result = translate(lang, key);

        // Replace parameters like {count}, {name}, etc.
        if (params) {
            for (const [param, value] of Object.entries(params)) {
                result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
            }
        }

        return result;
    };
};

// Available languages for UI display
export const AVAILABLE_LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
];

export { translations, flattenedTranslations };
export default translate;
