export interface SpendConfig {
    daily_cap: number;
    weekly_cap: number;
    monthly_cap: number;
    approval_mode: 'auto' | 'manual' | 'hybrid';
    auto_approval_threshold: number;
    allowed_vendors: string[];
}

export interface SpendTracker {
    daily_spent: number;
    weekly_spent: number;
    monthly_spent: number;
    last_reset_daily: string;
    last_reset_weekly: string;
    last_reset_monthly: string;
}

const CONFIG_KEY = 'spend_config';
const TRACKER_KEY = 'spend_tracker';

export const SpendControlsService = {
    // Get spend configuration
    getConfig(): SpendConfig {
        const data = localStorage.getItem(CONFIG_KEY);
        return data ? JSON.parse(data) : this.getDefaultConfig();
    },

    // Get default configuration
    getDefaultConfig(): SpendConfig {
        return {
            daily_cap: 5000,      // Increased for testing
            weekly_cap: 10000,    // Increased for testing
            monthly_cap: 50000,   // Increased for testing
            approval_mode: 'hybrid',
            auto_approval_threshold: 500,
            allowed_vendors: ['Amazon', 'Walmart', 'BigBasket', 'Local Store'],
        };
    },

    // Update configuration
    updateConfig(config: Partial<SpendConfig>): SpendConfig {
        const current = this.getConfig();
        const updated = { ...current, ...config };
        localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
        return updated;
    },

    // Get spend tracker
    getTracker(): SpendTracker {
        const data = localStorage.getItem(TRACKER_KEY);
        if (!data) {
            return this.resetTracker();
        }

        const tracker: SpendTracker = JSON.parse(data);

        // Check if we need to reset any periods
        const now = new Date();
        const lastDaily = new Date(tracker.last_reset_daily);
        const lastWeekly = new Date(tracker.last_reset_weekly);
        const lastMonthly = new Date(tracker.last_reset_monthly);

        let needsUpdate = false;

        // Reset daily if it's a new day
        if (now.getDate() !== lastDaily.getDate() || now.getMonth() !== lastDaily.getMonth()) {
            tracker.daily_spent = 0;
            tracker.last_reset_daily = now.toISOString();
            needsUpdate = true;
        }

        // Reset weekly if it's a new week
        const weekDiff = Math.floor((now.getTime() - lastWeekly.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weekDiff >= 1) {
            tracker.weekly_spent = 0;
            tracker.last_reset_weekly = now.toISOString();
            needsUpdate = true;
        }

        // Reset monthly if it's a new month
        if (now.getMonth() !== lastMonthly.getMonth() || now.getFullYear() !== lastMonthly.getFullYear()) {
            tracker.monthly_spent = 0;
            tracker.last_reset_monthly = now.toISOString();
            needsUpdate = true;
        }

        if (needsUpdate) {
            localStorage.setItem(TRACKER_KEY, JSON.stringify(tracker));
        }

        return tracker;
    },

    // Reset tracker
    resetTracker(): SpendTracker {
        const now = new Date().toISOString();
        const tracker: SpendTracker = {
            daily_spent: 0,
            weekly_spent: 0,
            monthly_spent: 0,
            last_reset_daily: now,
            last_reset_weekly: now,
            last_reset_monthly: now,
        };
        localStorage.setItem(TRACKER_KEY, JSON.stringify(tracker));
        return tracker;
    },

    // Add spend
    addSpend(amount: number): SpendTracker {
        const tracker = this.getTracker();
        tracker.daily_spent += amount;
        tracker.weekly_spent += amount;
        tracker.monthly_spent += amount;
        localStorage.setItem(TRACKER_KEY, JSON.stringify(tracker));
        return tracker;
    },

    // Check if purchase is allowed
    canPurchase(amount: number): {
        allowed: boolean;
        reason?: string;
        requiresApproval: boolean;
    } {
        const config = this.getConfig();
        const tracker = this.getTracker();

        // Check caps
        if (tracker.daily_spent + amount > config.daily_cap) {
            return {
                allowed: false,
                reason: `Would exceed daily cap of $${config.daily_cap}`,
                requiresApproval: true,
            };
        }

        if (tracker.weekly_spent + amount > config.weekly_cap) {
            return {
                allowed: false,
                reason: `Would exceed weekly cap of $${config.weekly_cap}`,
                requiresApproval: true,
            };
        }

        if (tracker.monthly_spent + amount > config.monthly_cap) {
            return {
                allowed: false,
                reason: `Would exceed monthly cap of $${config.monthly_cap}`,
                requiresApproval: true,
            };
        }

        // Check approval mode
        if (config.approval_mode === 'manual') {
            return {
                allowed: true,
                requiresApproval: true,
            };
        }

        if (config.approval_mode === 'auto') {
            return {
                allowed: true,
                requiresApproval: false,
            };
        }

        // Hybrid mode: check threshold
        if (amount > config.auto_approval_threshold) {
            return {
                allowed: true,
                requiresApproval: true,
                reason: `Amount exceeds auto-approval threshold of $${config.auto_approval_threshold}`,
            };
        }

        return {
            allowed: true,
            requiresApproval: false,
        };
    },

    // Get remaining budget
    getRemainingBudget(): {
        daily: number;
        weekly: number;
        monthly: number;
    } {
        const config = this.getConfig();
        const tracker = this.getTracker();

        return {
            daily: Math.max(0, config.daily_cap - tracker.daily_spent),
            weekly: Math.max(0, config.weekly_cap - tracker.weekly_spent),
            monthly: Math.max(0, config.monthly_cap - tracker.monthly_spent),
        };
    },
};
