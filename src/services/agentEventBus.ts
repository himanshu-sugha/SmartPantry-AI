// Global Agent Event Bus
// This captures ALL events in the app and sends them to the agent

import { AutonomousAgentService } from './autonomousAgent';

export type AppEventType =
    | 'item_added'
    | 'item_deleted'
    | 'item_updated'
    | 'item_consumed'
    | 'order_placed'
    | 'order_approved'
    | 'order_rejected'
    | 'settings_changed'
    | 'inventory_loaded'
    | 'search_performed'
    | 'receipt_scanned'
    | 'spend_cap_hit'
    | 'agent_started'
    | 'agent_completed'
    | 'error_occurred';

export interface AppEvent {
    type: AppEventType;
    message: string;
    data?: any;
    timestamp: number;
}

// Initialize flag
let isInitialized = false;

export const AgentEventBus = {
    // Initialize the event bus
    init() {
        if (isInitialized) return;
        isInitialized = true;
        console.log('[AgentEventBus] Initialized - All events will be logged to agent');
    },

    // Emit an event to the agent
    emit(type: AppEventType, message: string, data?: any) {
        if (typeof window === 'undefined') return;

        // Map event type to thought type
        const thoughtType = this.getThoughtType(type);

        // Add thought to agent
        try {
            AutonomousAgentService.addThought(thoughtType, message, data);
        } catch (e) {
            console.log('[AgentEventBus] Could not log event:', message);
        }
    },

    // Get thought type based on event
    getThoughtType(type: AppEventType): 'observation' | 'analysis' | 'decision' | 'action' | 'waiting' {
        switch (type) {
            case 'item_added':
            case 'item_deleted':
            case 'item_updated':
            case 'item_consumed':
            case 'inventory_loaded':
            case 'receipt_scanned':
            case 'search_performed':
                return 'observation';

            case 'spend_cap_hit':
            case 'error_occurred':
                return 'analysis';

            case 'order_approved':
            case 'order_rejected':
            case 'settings_changed':
                return 'decision';

            case 'order_placed':
            case 'agent_started':
            case 'agent_completed':
                return 'action';

            default:
                return 'observation';
        }
    },

    // Helper methods for common events
    logItemAdded(itemName: string, quantity: number) {
        this.emit('item_added', `📥 Item added: "${itemName}" (${quantity} units)`);
    },

    logItemDeleted(itemName: string) {
        this.emit('item_deleted', `🗑️ Item deleted: "${itemName}"`);
    },

    logItemUpdated(itemName: string, changes: string) {
        this.emit('item_updated', `✏️ Item updated: "${itemName}" - ${changes}`);
    },

    logItemConsumed(itemName: string, quantity: number, remaining: number) {
        this.emit('item_consumed', `🍽️ Consumed: "${itemName}" x${quantity} → ${remaining} remaining`);
    },

    logOrderPlaced(items: string[], total: number) {
        this.emit('order_placed', `🛒 Order placed: ${items.length} items for $${total.toFixed(2)}`);
    },

    logInventoryLoaded(count: number) {
        this.emit('inventory_loaded', `📦 Inventory loaded: ${count} items`);
    },

    logSettingsChanged(setting: string, value: any) {
        this.emit('settings_changed', `⚙️ Settings changed: ${setting} = ${value}`);
    },

    logReceiptScanned(itemCount: number) {
        this.emit('receipt_scanned', `📄 Receipt scanned: Found ${itemCount} items`);
    },

    logSearch(query: string, resultCount: number) {
        this.emit('search_performed', `🔍 Search: "${query}" → ${resultCount} results`);
    },

    logSpendCapHit(amount: number, cap: number) {
        this.emit('spend_cap_hit', `🚫 Spend cap hit: $${amount} exceeds $${cap} limit`);
    },

    logError(context: string, error: string) {
        this.emit('error_occurred', `❌ Error in ${context}: ${error}`);
    },
};

// Auto-initialize
if (typeof window !== 'undefined') {
    AgentEventBus.init();
}
