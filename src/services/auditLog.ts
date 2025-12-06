import { BlockchainService } from './blockchain';

export type AuditEventType =
    | 'item_added'
    | 'item_consumed'
    | 'suggestion_generated'
    | 'checkout_initiated'
    | 'purchase_approved'
    | 'purchase_rejected'
    | 'spend_cap_set'
    | 'spend_cap_exceeded'
    | 'encryption_enabled'
    | 'wallet_connected';

export interface AuditLogEntry {
    id: string;
    event_type: AuditEventType;
    timestamp: number;
    data: any;
    blockchain_tx?: string;
    user_action: boolean;
}

const STORAGE_KEY = 'audit_logs';

export const AuditLogService = {
    // Create audit log entry
    logEvent(
        eventType: AuditEventType,
        data: any,
        userAction: boolean = false,
        createBlockchainTx: boolean = true
    ): AuditLogEntry {
        const entry: AuditLogEntry = {
            id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            event_type: eventType,
            timestamp: Date.now(),
            data,
            user_action: userAction,
        };

        // Create blockchain transaction for important events
        if (createBlockchainTx) {
            try {
                const tx = BlockchainService.createTransaction('audit_log', {
                    event_type: eventType,
                    data,
                    user_action: userAction,
                });
                entry.blockchain_tx = tx.signature;
            } catch (error) {
                console.warn('Failed to create blockchain transaction:', error);
            }
        }

        // Store in localStorage
        const logs = this.getLogs();
        logs.push(entry);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

        return entry;
    },

    // Get all logs
    getLogs(): AuditLogEntry[] {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Get logs by event type
    getLogsByType(eventType: AuditEventType): AuditLogEntry[] {
        return this.getLogs().filter(log => log.event_type === eventType);
    },

    // Get logs by date range
    getLogsByDateRange(startDate: Date, endDate: Date): AuditLogEntry[] {
        const start = startDate.getTime();
        const end = endDate.getTime();
        return this.getLogs().filter(log => log.timestamp >= start && log.timestamp <= end);
    },

    // Get recent logs
    getRecentLogs(count: number = 50): AuditLogEntry[] {
        const logs = this.getLogs();
        return logs.slice(-count).reverse();
    },

    // Get user actions only
    getUserActions(): AuditLogEntry[] {
        return this.getLogs().filter(log => log.user_action);
    },

    // Get AI actions only
    getAIActions(): AuditLogEntry[] {
        return this.getLogs().filter(log => !log.user_action);
    },

    // Export logs as JSON
    exportLogs(): string {
        const logs = this.getLogs();
        return JSON.stringify(logs, null, 2);
    },

    // Get statistics
    getStatistics() {
        const logs = this.getLogs();
        const userActions = logs.filter(log => log.user_action).length;
        const aiActions = logs.filter(log => !log.user_action).length;

        const eventCounts = logs.reduce((acc, log) => {
            acc[log.event_type] = (acc[log.event_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: logs.length,
            userActions,
            aiActions,
            eventCounts,
            blockchainTxs: logs.filter(log => log.blockchain_tx).length,
        };
    },

    // Clear all logs (for testing)
    clearLogs(): void {
        localStorage.removeItem(STORAGE_KEY);
    },
};
