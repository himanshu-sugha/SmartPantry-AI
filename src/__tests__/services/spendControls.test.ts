/**
 * SmartPantry AI - Spend Controls Service Tests
 * Tests for spending limits and approval logic
 */

import { SpendControlsService } from '@/services/spendControls';

describe('SpendControlsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (localStorage.getItem as jest.Mock).mockReturnValue(null);
        (localStorage.setItem as jest.Mock).mockImplementation(() => { });
    });

    describe('getConfig', () => {
        it('should return default config when none exists', () => {
            const config = SpendControlsService.getConfig();

            expect(config).toBeDefined();
            expect(config.daily_cap).toBe(500);
            expect(config.approval_mode).toBeDefined();
        });

        it('should return stored config when it exists', () => {
            const mockConfig = {
                daily_cap: 100,
                weekly_cap: 500,
                monthly_cap: 2000,
                approval_mode: 'auto',
                auto_approval_threshold: 50,
                allowed_vendors: ['Amazon'],
            };
            (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

            const config = SpendControlsService.getConfig();
            expect(config.daily_cap).toBe(100);
            expect(config.approval_mode).toBe('auto');
        });
    });

    describe('canPurchase', () => {
        it('should allow purchase under daily cap', () => {
            const mockConfig = {
                daily_cap: 100,
                weekly_cap: 500,
                monthly_cap: 2000,
                approval_mode: 'auto',
                auto_approval_threshold: 50,
                allowed_vendors: ['Amazon'],
            };
            const mockTracker = {
                daily_spent: 20,
                weekly_spent: 100,
                monthly_spent: 500,
                last_reset_daily: new Date().toISOString(),
                last_reset_weekly: new Date().toISOString(),
                last_reset_monthly: new Date().toISOString(),
            };

            (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
                if (key.includes('config')) return JSON.stringify(mockConfig);
                if (key.includes('tracker')) return JSON.stringify(mockTracker);
                return null;
            });

            const result = SpendControlsService.canPurchase(30);
            expect(result.allowed).toBe(true);
        });

        it('should deny purchase over daily cap', () => {
            const mockConfig = {
                daily_cap: 50,
                weekly_cap: 500,
                monthly_cap: 2000,
                approval_mode: 'auto',
                auto_approval_threshold: 50,
                allowed_vendors: ['Amazon'],
            };
            const mockTracker = {
                daily_spent: 40,
                weekly_spent: 100,
                monthly_spent: 500,
                last_reset_daily: new Date().toISOString(),
                last_reset_weekly: new Date().toISOString(),
                last_reset_monthly: new Date().toISOString(),
            };

            (localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
                if (key.includes('config')) return JSON.stringify(mockConfig);
                if (key.includes('tracker')) return JSON.stringify(mockTracker);
                return null;
            });

            const result = SpendControlsService.canPurchase(20);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('daily');
        });
    });

    describe('addSpend', () => {
        it('should track spending correctly', () => {
            const mockTracker = {
                daily_spent: 0,
                weekly_spent: 0,
                monthly_spent: 0,
                last_reset_daily: new Date().toISOString(),
                last_reset_weekly: new Date().toISOString(),
                last_reset_monthly: new Date().toISOString(),
            };
            (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockTracker));

            SpendControlsService.addSpend(50);
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });
});
