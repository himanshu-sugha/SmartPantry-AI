export interface ConsumptionLog {
    id: string;
    item_id: string;
    item_name: string;
    quantity_used: number;
    timestamp: string;
    user_id: string;
}

export interface ItemPrediction {
    item_id: string;
    predicted_runout_date: string | null;
    avg_daily_usage: number;
    confidence_score: number;
    days_until_runout: number | null;
    last_updated: string;
}

export interface ConsumptionStats {
    total_consumed: number;
    avg_daily_usage: number;
    days_tracked: number;
    first_log_date: string | null;
    last_log_date: string | null;
}
