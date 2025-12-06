import { ForecastingService } from './forecasting';
import { ConsumptionService } from './consumption';
import { InventoryItem } from '@/types/inventory';

export interface SmartSuggestion {
    item: InventoryItem;
    reason: string;
    recommendedQuantity: number;
    urgency: 'high' | 'medium' | 'low';
    confidence: number;
}

export const SuggestionsService = {
    // Generate smart shopping suggestions based on inventory and consumption
    generateSuggestions(inventory: InventoryItem[]): SmartSuggestion[] {
        const suggestions: SmartSuggestion[] = [];

        for (const item of inventory) {
            const recommendation = ForecastingService.getReorderRecommendation(
                item.id,
                item.quantity
            );

            if (recommendation.shouldReorder) {
                const prediction = ForecastingService.predictRunout(item.id, item.quantity);

                let urgency: 'high' | 'medium' | 'low' = 'low';
                if (prediction.days_until_runout !== null) {
                    if (prediction.days_until_runout <= 3) urgency = 'high';
                    else if (prediction.days_until_runout <= 7) urgency = 'medium';
                }

                suggestions.push({
                    item,
                    reason: recommendation.reason,
                    recommendedQuantity: recommendation.recommendedQuantity,
                    urgency,
                    confidence: prediction.confidence_score,
                });
            }
        }

        // Sort by urgency (high first) and then by confidence
        return suggestions.sort((a, b) => {
            const urgencyOrder = { high: 0, medium: 1, low: 2 };
            if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
                return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            }
            return b.confidence - a.confidence;
        });
    },

    // Get consumption insights
    getConsumptionInsights() {
        const logs = ConsumptionService.getRecentLogs(30);

        // Group by item
        const itemConsumption = logs.reduce((acc, log) => {
            if (!acc[log.item_id]) {
                acc[log.item_id] = {
                    item_name: log.item_name,
                    total: 0,
                    count: 0,
                };
            }
            acc[log.item_id].total += log.quantity_used;
            acc[log.item_id].count += 1;
            return acc;
        }, {} as Record<string, { item_name: string; total: number; count: number }>);

        // Get top consumed items
        const topItems = Object.entries(itemConsumption)
            .map(([id, data]) => ({
                id,
                name: data.item_name,
                total: data.total,
                avg_per_use: data.total / data.count,
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        return {
            topItems,
            totalLogs: logs.length,
            totalConsumed: logs.reduce((sum, log) => sum + log.quantity_used, 0),
        };
    },
};
