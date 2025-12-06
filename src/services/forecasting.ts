import { ConsumptionService } from './consumption';
import { ItemPrediction } from '@/types/consumption';

// Day-of-week consumption multipliers (based on typical patterns)
// Index 0 = Sunday, 6 = Saturday
const DAY_MULTIPLIERS = [1.15, 0.95, 0.90, 0.95, 1.00, 1.05, 1.20];
// People consume more on weekends (cooking at home) and less mid-week

export const ForecastingService = {
    // Calculate simple moving average for daily usage
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

    // Exponential Moving Average (EMA) - weights recent data more heavily
    // This is a more sophisticated ML technique than simple moving average
    calculateEMA(itemId: string, alpha: number = 0.3): number {
        const logs = ConsumptionService.getItemLogs(itemId);

        if (logs.length === 0) return 0;
        if (logs.length === 1) return logs[0].quantity_used;

        // Sort logs by timestamp (oldest first)
        const sortedLogs = [...logs].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Calculate EMA: EMA_today = α × Value_today + (1 - α) × EMA_yesterday
        let ema = sortedLogs[0].quantity_used;

        for (let i = 1; i < sortedLogs.length; i++) {
            ema = alpha * sortedLogs[i].quantity_used + (1 - alpha) * ema;
        }

        return ema;
    },

    // Get day-of-week seasonality adjustment
    // Returns a multiplier to adjust predictions based on what day it is
    getSeasonalityMultiplier(targetDate: Date = new Date()): number {
        const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday
        return DAY_MULTIPLIERS[dayOfWeek];
    },

    // Combined prediction using both MA and EMA with seasonality
    getSmartPrediction(itemId: string, windowDays: number = 14): number {
        const ma = this.calculateMovingAverage(itemId, windowDays);
        const ema = this.calculateEMA(itemId, 0.3);

        if (ma === 0 && ema === 0) return 0;
        if (ma === 0) return ema;
        if (ema === 0) return ma;

        // Weighted average: 40% MA + 60% EMA (prefer recent trends)
        const baseAvg = ma * 0.4 + ema * 0.6;

        // Apply seasonality adjustment for today
        const seasonality = this.getSeasonalityMultiplier();

        return baseAvg * seasonality;
    },

    // Predict run-out date for an item (using enhanced ML)
    predictRunout(itemId: string, currentQuantity: number): ItemPrediction & {
        usage_count?: number;
        ml_method?: string;
        seasonality_factor?: number;
    } {
        const stats = ConsumptionService.getItemStats(itemId);
        const logs = ConsumptionService.getItemLogs(itemId);
        const usageCount = logs.length;

        // Not enough data - use estimation
        if (stats.days_tracked < 3 || usageCount < 2) {
            const estimatedUsage = currentQuantity > 0 ? 0.5 : 0;
            return {
                item_id: itemId,
                predicted_runout_date: null,
                avg_daily_usage: estimatedUsage,
                confidence_score: 0,
                days_until_runout: currentQuantity > 0 ? Math.ceil(currentQuantity / 0.5) : 0,
                last_updated: new Date().toISOString(),
                usage_count: usageCount,
                ml_method: 'estimation',
                seasonality_factor: 1.0,
            };
        }

        // Use enhanced prediction with EMA + seasonality
        const smartAvg = this.getSmartPrediction(itemId, 14);
        const seasonality = this.getSeasonalityMultiplier();

        // Calculate days until runout
        const daysUntilRunout = smartAvg > 0 ? Math.floor(currentQuantity / smartAvg) : 999;

        // Calculate predicted date
        const runoutDate = new Date();
        runoutDate.setDate(runoutDate.getDate() + daysUntilRunout);

        // Calculate confidence score (0-1)
        const dataConfidence = Math.min(stats.days_tracked / 30, 1);
        const countConfidence = Math.min(usageCount / 10, 1); // More logs = more confidence
        const consistencyConfidence = this.calculateConsistencyScore(itemId);

        // Weighted confidence: data history + usage count + consistency
        const confidenceScore = (dataConfidence * 0.3 + countConfidence * 0.3 + consistencyConfidence * 0.4);

        return {
            item_id: itemId,
            predicted_runout_date: runoutDate.toISOString(),
            avg_daily_usage: smartAvg,
            confidence_score: confidenceScore,
            days_until_runout: daysUntilRunout,
            last_updated: new Date().toISOString(),
            usage_count: usageCount,
            ml_method: 'EMA+Seasonality',
            seasonality_factor: seasonality,
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
        const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
        return Math.max(0, 1 - coefficientOfVariation);
    },

    // Get reorder recommendation (enhanced with seasonality consideration)
    getReorderRecommendation(itemId: string, currentQuantity: number): {
        shouldReorder: boolean;
        recommendedQuantity: number;
        reason: string;
        urgency: 'low' | 'medium' | 'high';
    } {
        const prediction = this.predictRunout(itemId, currentQuantity);

        if (!prediction.days_until_runout || prediction.ml_method === 'estimation') {
            return {
                shouldReorder: currentQuantity <= 2,
                recommendedQuantity: 5,
                reason: 'Insufficient usage data. Recommending based on low stock.',
                urgency: currentQuantity <= 1 ? 'high' : 'medium',
            };
        }

        const daysLeft = prediction.days_until_runout;

        // Determine urgency
        let urgency: 'low' | 'medium' | 'high' = 'low';
        if (daysLeft <= 3) urgency = 'high';
        else if (daysLeft <= 7) urgency = 'medium';

        // Reorder if less than 7 days of stock
        const shouldReorder = daysLeft <= 7;

        // Recommend 2 weeks worth of stock, adjusted for upcoming weekend if applicable
        let recommendedQuantity = Math.ceil(prediction.avg_daily_usage * 14);

        // If weekend is coming, add a buffer
        const today = new Date().getDay();
        if (today >= 4) { // Thursday onwards
            recommendedQuantity = Math.ceil(recommendedQuantity * 1.1);
        }

        let reason = '';
        if (shouldReorder) {
            reason = `⚠️ Runs out in ${daysLeft} days (${prediction.ml_method}). Recommend ${recommendedQuantity} units.`;
        } else {
            reason = `✅ Stock sufficient for ${daysLeft} days.`;
        }

        return {
            shouldReorder,
            recommendedQuantity,
            reason,
            urgency,
        };
    },

    // Get ML model info for display
    getModelInfo(): {
        name: string;
        methods: string[];
        features: string[];
    } {
        return {
            name: 'SmartPantry Consumption Predictor',
            methods: [
                'Simple Moving Average (SMA)',
                'Exponential Moving Average (EMA)',
                'Day-of-Week Seasonality',
                'Variance-based Consistency Score',
            ],
            features: [
                'Runout date prediction',
                'Smart reorder recommendations',
                'Confidence scoring',
                'Urgency classification',
            ],
        };
    },
};

