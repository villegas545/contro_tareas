/**
 * Firebase Debug Logger
 * Generates a JSON log file with all Firebase operations for debugging
 */

interface LogEntry {
    timestamp: string;
    operation: string;
    collection: string;
    documentId?: string;
    data?: any;
    result?: 'success' | 'error';
    error?: string;
    duration?: number;
}

interface DebugLog {
    sessionStart: string;
    debugDate: string | null;
    entries: LogEntry[];
}

class FirebaseLogger {
    private log: DebugLog;
    private isEnabled: boolean = true;

    constructor() {
        this.log = {
            sessionStart: new Date().toISOString(),
            debugDate: null,
            entries: []
        };
    }

    setDebugDate(date: string | null) {
        this.log.debugDate = date;
    }

    logOperation(
        operation: string,
        collection: string,
        documentId?: string,
        data?: any,
        result: 'success' | 'error' = 'success',
        error?: string,
        duration?: number
    ) {
        if (!this.isEnabled) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            operation,
            collection,
            documentId,
            data: data ? this.sanitizeData(data) : undefined,
            result,
            error,
            duration
        };

        this.entries.push(entry);

        // Log to console as well
        const emoji = result === 'success' ? '✅' : '❌';
        console.log(`${emoji} [Firebase] ${operation} ${collection}${documentId ? '/' + documentId : ''}`);

        // Save to localStorage for persistence (web only)
        this.saveToStorage();
    }

    get entries() {
        return this.log.entries;
    }

    private sanitizeData(data: any): any {
        // Remove sensitive fields and limit data size
        const sanitized = { ...data };
        delete sanitized.password;
        delete sanitized.token;

        // Truncate long strings
        for (const key in sanitized) {
            if (typeof sanitized[key] === 'string' && sanitized[key].length > 200) {
                sanitized[key] = sanitized[key].substring(0, 200) + '...';
            }
        }
        return sanitized;
    }

    private saveToStorage() {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.setItem('firebase_debug_log', JSON.stringify(this.log, null, 2));
            } catch (e) {
                // Storage full or not available
            }
        }
    }

    getLog(): DebugLog {
        return this.log;
    }

    downloadLog() {
        if (typeof window !== 'undefined') {
            const blob = new Blob([JSON.stringify(this.log, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `firebase_log_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    clear() {
        this.log.entries = [];
        this.saveToStorage();
    }

    // Get summary stats
    getSummary() {
        const ops: Record<string, number> = {};
        const collections: Record<string, number> = {};
        let errors = 0;

        for (const entry of this.log.entries) {
            ops[entry.operation] = (ops[entry.operation] || 0) + 1;
            collections[entry.collection] = (collections[entry.collection] || 0) + 1;
            if (entry.result === 'error') errors++;
        }

        return {
            totalOperations: this.log.entries.length,
            errors,
            byOperation: ops,
            byCollection: collections
        };
    }
}

// Singleton instance
export const firebaseLogger = new FirebaseLogger();

// Helper to wrap async operations with logging
export async function loggedOperation<T>(
    operation: string,
    collection: string,
    documentId: string | undefined,
    fn: () => Promise<T>,
    data?: any
): Promise<T> {
    const start = Date.now();
    try {
        const result = await fn();
        firebaseLogger.logOperation(operation, collection, documentId, data, 'success', undefined, Date.now() - start);
        return result;
    } catch (error: any) {
        firebaseLogger.logOperation(operation, collection, documentId, data, 'error', error.message, Date.now() - start);
        throw error;
    }
}
