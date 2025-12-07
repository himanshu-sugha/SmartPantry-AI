import { ConsumptionService } from './consumption';
import { ItemPrediction } from '@/types/consumption';

export const ForecastingService = {
    // Calculate moving average for daily usage
    calculateMovingAverage(itemId: string, windowDays: number = 7): number {
        const stats = ConsumptionService.getItemStats(itemId);

        if (stats.days_tracked === 0) return 0;

        // For short tracking periods, use simple average
        if (stats.days_tracked < windowDays) {
            return stats.avg_daily_usage;
        }

        // Get recent logs within window
        const logs = ConsumptionService.getItemLogs(itemId);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - windowDays);

        const recentLogs = logs.filter(
            log => new Date(log.timestamp) >= cutoffDate
        );

        const totalConsumed = recentLogs.reduce((sum, log) => sum + log.quantity_used, 0);
        return totalConsumed / windowDays;
    },

    // Predict run-out date for an item
    predictRunout(itemId: string, currentQuantity: number): ItemPrediction & { usage_count?: number } {
        const avgDailyUsage = this.calculateMovingAverage(itemId, 14); // 14-day window
        const stats = ConsumptionService.getItemStats(itemId);
        const logs = ConsumptionService.getItemLogs(itemId);
        const usageCount = logs.length;

        // No consumption data at all - return null prediction
        // Only need 1 consumption event to start making predictions (demo-friendly)
        if (usageCount === 0 || avgDailyUsage === 0) {
            return {
                item_id: itemId,
                predicted_runout_date: null,
                avg_daily_usage: 0,
                confidence_score: 0,
                days_until_runout: null, // Null = no prediction available
                last_updated: new Date().toISOString(),
                usage_count: usageCount,
            };
        }

        // Calculate days until runout
        const daysUntilRunout = Math.floor(currentQuantity / avgDailyUsage);

        // Calculate predicted date
        const runoutDate = new Date();
        runoutDate.setDate(runoutDate.getDate() + daysUntilRunout);

        // Calculate confidence score (0-1)
        // Higher confidence with more data and consistent usage
        const dataConfidence = Math.min(stats.days_tracked / 30, 1); // Max at 30 days
        const consistencyConfidence = this.calculateConsistencyScore(itemId);
        const confidenceScore = (dataConfidence + consistencyConfidence) / 2;

        return {
            item_id: itemId,
            predicted_runout_date: runoutDate.toISOString(),
            avg_daily_usage: avgDailyUsage,
            confidence_score: confidenceScore,
            days_until_runout: daysUntilRunout,
            last_updated: new Date().toISOString(),
        };
    },

    // Calculate consistency score based on variance in consumption
    calculateConsistencyScore(itemId: string): number {
        const logs = ConsumptionService.getItemLogs(itemId);

        if (logs.length < 2) return 0;

        // Calculate variance in daily consumption
        const quantities = logs.map(log => log.quantity_used);
        const mean = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
        const variance = quantities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / quantities.length;
        const stdDev = Math.sqrt(variance);

        // Lower variance = higher consistency
        // Normalize to 0-1 range (assuming std dev < mean is good)
        const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
        return Math.max(0, 1 - coefficientOfVariation);
    },

    // Get reorder recommendation
    getReorderRecommendation(itemId: string, currentQuantity: number): {
        shouldReorder: boolean;
        recommendedQuantity: number;
        reason: string;
    } {
        const prediction = this.predictRunout(itemId, currentQuantity);

        // No prediction data - DON'T suggest reorder (wait for consumption history)
        if (!prediction.days_until_runout || prediction.confidence_score === 0) {
            return {
                shouldReorder: false,
                recommendedQuantity: 0,
                reason: 'Waiting for consumption data before making predictions.',
            };
        }

        // Reorder if less than 7 days of stock (only with real prediction data)
        const shouldReorder = prediction.days_until_runout <= 7;

        // Recommend 2 weeks worth of stock
        const recommendedQuantity = Math.ceil(prediction.avg_daily_usage * 14);

        let reason = '';
        if (shouldReorder) {
            reason = `Predicted to run out in ${prediction.days_until_runout} days. Recommending ${recommendedQuantity} units for 2 weeks.`;
        } else {
            reason = `Sufficient stock for ${prediction.days_until_runout} days.`;
        }

        return {
            shouldReorder,
            recommendedQuantity,
            reason,
        };
    },
};
