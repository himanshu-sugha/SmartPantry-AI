'use client'

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, TrendingDown, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { ItemPrediction } from '@/types/consumption';

interface PredictionCardProps {
    item: InventoryItem;
    prediction: ItemPrediction;
}

export function PredictionCard({ item, prediction }: PredictionCardProps) {
    if (!prediction.days_until_runout) {
        return null;
    }

    const isUrgent = prediction.days_until_runout <= 3;
    const isWarning = prediction.days_until_runout > 3 && prediction.days_until_runout <= 7;

    const getConfidenceLabel = (score: number) => {
        if (score >= 0.7) return 'High';
        if (score >= 0.4) return 'Medium';
        return 'Low';
    };

    const getConfidenceColor = (score: number) => {
        if (score >= 0.7) return 'text-green-600';
        if (score >= 0.4) return 'text-yellow-600';
        return 'text-gray-500';
    };

    return (
        <Card className={`border-l-4 ${isUrgent ? 'border-l-red-500 bg-red-50' : isWarning ? 'border-l-yellow-500 bg-yellow-50' : 'border-l-blue-500'}`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            {isUrgent ? (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-blue-600" />
                            )}
                            <h4 className="font-semibold text-sm">{item.name}</h4>
                        </div>

                        <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-gray-500" />
                                <span className={isUrgent ? 'text-red-700 font-semibold' : isWarning ? 'text-yellow-700 font-semibold' : 'text-gray-700'}>
                                    {prediction.days_until_runout} days until run-out
                                </span>
                            </div>

                            <div className="text-gray-600">
                                Avg usage: <span className="font-medium">{prediction.avg_daily_usage.toFixed(2)}</span> per day
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">Confidence:</span>
                                <Badge variant="outline" className={getConfidenceColor(prediction.confidence_score)}>
                                    {getConfidenceLabel(prediction.confidence_score)} ({Math.round(prediction.confidence_score * 100)}%)
                                </Badge>
                            </div>
                            {prediction.confidence_score < 0.5 && (
                                <div className="text-xs text-gray-400 italic">
                                    💡 Confidence increases with more usage data
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
