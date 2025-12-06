// Agent Approval Modes Service
// Controls how the autonomous agent handles purchase decisions

export type ApprovalMode = 'auto' | 'semi-auto' | 'manual';

export interface ApprovalSettings {
    mode: ApprovalMode;
    autoApproveLimit: number; // For semi-auto: auto-approve under this amount
    requireConfirmation: boolean; // Extra confirmation dialog
    notifyOnPurchase: boolean; // Send notification after purchase
}

const STORAGE_KEY = 'smartpantry_approval_settings';

const DEFAULT_SETTINGS: ApprovalSettings = {
    mode: 'manual',
    autoApproveLimit: 500, // $500 default limit for semi-auto
    requireConfirmation: true,
    notifyOnPurchase: true,
};

export const ApprovalModeService = {
    // Get current settings
    getSettings(): ApprovalSettings {
        if (typeof window === 'undefined') return DEFAULT_SETTINGS;

        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return DEFAULT_SETTINGS;

        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
        } catch {
            return DEFAULT_SETTINGS;
        }
    },

    // Save settings
    saveSettings(settings: Partial<ApprovalSettings>): void {
        if (typeof window === 'undefined') return;

        const current = this.getSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },

    // Get current mode
    getMode(): ApprovalMode {
        return this.getSettings().mode;
    },

    // Set mode
    setMode(mode: ApprovalMode): void {
        this.saveSettings({ mode });
    },

    // Check if purchase should be auto-approved
    shouldAutoApprove(amount: number): { approved: boolean; reason: string } {
        const settings = this.getSettings();

        switch (settings.mode) {
            case 'auto':
                return {
                    approved: true,
                    reason: 'Auto mode: Order approved automatically'
                };

            case 'semi-auto':
                if (amount <= settings.autoApproveLimit) {
                    return {
                        approved: true,
                        reason: `Semi-auto: Order under $${settings.autoApproveLimit} limit`
                    };
                }
                return {
                    approved: false,
                    reason: `Semi-auto: Order exceeds $${settings.autoApproveLimit} limit, manual approval required`
                };

            case 'manual':
            default:
                return {
                    approved: false,
                    reason: 'Manual mode: User approval required for all orders'
                };
        }
    },

    // Get mode description for UI
    getModeDescription(mode: ApprovalMode): string {
        switch (mode) {
            case 'auto':
                return 'Agent places orders automatically without asking';
            case 'semi-auto':
                return 'Auto-approve orders under a set limit';
            case 'manual':
                return 'Always ask for approval before ordering';
            default:
                return '';
        }
    },

    // Get mode icon
    getModeIcon(mode: ApprovalMode): string {
        switch (mode) {
            case 'auto': return '🤖';
            case 'semi-auto': return '⚡';
            case 'manual': return '👤';
            default: return '❓';
        }
    },
};
