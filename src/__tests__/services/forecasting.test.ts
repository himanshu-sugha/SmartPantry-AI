/**
 * SmartPantry AI - Forecasting Service Tests
 * Tests for ML-based consumption prediction
 */

import { ForecastingService } from '@/services/forecasting';

// Mock ConsumptionService
jest.mock('@/services/consumption', () => ({
    ConsumptionService: {
        getItemStats: jest.fn().mockReturnValue({
            days_tracked: 10,
            avg_daily_usage: 0.5,
            total_consumed: 5,
        }),
        getItemLogs: jest.fn().mockReturnValue([
            { item_id: 'item-1', quantity_used: 0.5, timestamp: new Date().toISOString() },
            { item_id: 'item-1', quantity_used: 0.5, timestamp: new Date().toISOString() },
        ]),
        getRecentLogs: jest.fn().mockReturnValue([]),
    },
}));

describe('ForecastingService', () => {
    describe('calculateMovingAverage', () => {
        it('should calculate moving average for item consumption', () => {
            const avg = ForecastingService.calculateMovingAverage('item-1', 7);
            expect(typeof avg).toBe('number');
            expect(avg).toBeGreaterThanOrEqual(0);
        });
    });

    describe('predictRunout', () => {
        it('should predict runout date for item', () => {
            const prediction = ForecastingService.predictRunout('item-1', 5);

            expect(prediction).toBeDefined();
            expect(prediction.item_id).toBe('item-1');
            expect(prediction.avg_daily_usage).toBeDefined();
        });

        it('should return null prediction for insufficient data', () => {
            const { ConsumptionService } = require('@/services/consumption');
            ConsumptionService.getItemStats.mockReturnValueOnce({
                days_tracked: 1,
                avg_daily_usage: 0,
                total_consumed: 0,
            });

            const prediction = ForecastingService.predictRunout('new-item', 10);
            expect(prediction.days_until_runout).toBeNull();
        });
    });

    describe('getReorderRecommendation', () => {
        it('should recommend reorder for low stock items', () => {
            const recommendation = ForecastingService.getReorderRecommendation('item-1', 1);

            expect(recommendation).toBeDefined();
            expect(recommendation.recommendedQuantity).toBeGreaterThan(0);
        });

        it('should not recommend reorder for high stock items', () => {
            const recommendation = ForecastingService.getReorderRecommendation('item-1', 100);

            expect(recommendation.shouldReorder).toBe(false);
        });
    });
});
