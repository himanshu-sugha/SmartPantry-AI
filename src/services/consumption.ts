import { ConsumptionLog, ConsumptionStats } from '@/types/consumption';

const STORAGE_KEY = 'smartpantry_consumption_logs';

export const ConsumptionService = {
    // Get all consumption logs
    getLogs(): ConsumptionLog[] {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Get logs for a specific item
    getItemLogs(itemId: string): ConsumptionLog[] {
        return this.getLogs().filter(log => log.item_id === itemId);
    },

    // Log consumption
    logConsumption(itemId: string, itemName: string, quantityUsed: number): ConsumptionLog {
        const log: ConsumptionLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            item_id: itemId,
            item_name: itemName,
            quantity_used: quantityUsed,
            timestamp: new Date().toISOString(),
            user_id: 'user-123', // Mock user ID
        };

        const logs = this.getLogs();
        logs.push(log);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

        return log;
    },

    // Get consumption statistics for an item
    getItemStats(itemId: string): ConsumptionStats {
        const logs = this.getItemLogs(itemId).sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        if (logs.length === 0) {
            return {
                total_consumed: 0,
                avg_daily_usage: 0,
                days_tracked: 0,
                first_log_date: null,
                last_log_date: null,
            };
        }

        const firstDate = new Date(logs[0].timestamp);
        const lastDate = new Date(logs[logs.length - 1].timestamp);
        const daysTracked = Math.max(
            1,
            Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
        );

        const totalConsumed = logs.reduce((sum, log) => sum + log.quantity_used, 0);
        const avgDailyUsage = totalConsumed / daysTracked;

        return {
            total_consumed: totalConsumed,
            avg_daily_usage: avgDailyUsage,
            days_tracked: daysTracked,
            first_log_date: logs[0].timestamp,
            last_log_date: logs[logs.length - 1].timestamp,
        };
    },

    // Delete a log
    deleteLog(logId: string): void {
        const logs = this.getLogs().filter(log => log.id !== logId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    },

    // Clear all logs
    clearAllLogs(): void {
        localStorage.removeItem(STORAGE_KEY);
    },

    // Get recent logs (last N days)
    getRecentLogs(days: number = 30): ConsumptionLog[] {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return this.getLogs().filter(
            log => new Date(log.timestamp) >= cutoffDate
        );
    },
};
