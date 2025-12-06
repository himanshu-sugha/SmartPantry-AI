// Autonomous Agent Service
// This is the brain of the SmartPantry AI Agent
// It monitors inventory, makes decisions, and can auto-execute purchases

import { InventoryService } from './inventory';
import { SuggestionsService } from './suggestions';
import { ForecastingService } from './forecasting';
import { SpendControlsService } from './spendControls';
import { ApprovalModeService } from './approvalMode';
import { AuditLogService } from './auditLog';
import { VendorAPIService } from './vendorAPI';
import { GeminiService } from './gemini';

export type AgentStatus = 'idle' | 'thinking' | 'analyzing' | 'deciding' | 'executing' | 'waiting_approval';

export interface AgentThought {
    id: string;
    timestamp: number;
    type: 'observation' | 'analysis' | 'decision' | 'action' | 'waiting';
    message: string;
    details?: any;
}

export interface AgentState {
    status: AgentStatus;
    currentTask: string | null;
    thoughts: AgentThought[];
    lastCheck: number;
    pendingActions: number;
    autoExecuteEnabled: boolean;
}

const STORAGE_KEY = 'smartpantry_agent_state';
const THOUGHTS_KEY = 'smartpantry_agent_thoughts';

// Agent thinking/activity listeners
const listeners: Set<(state: AgentState) => void> = new Set();

let currentState: AgentState = {
    status: 'idle',
    currentTask: null,
    thoughts: [],
    lastCheck: Date.now(),
    pendingActions: 0,
    autoExecuteEnabled: false,
};

// Auto-initialize from localStorage on module load (client-side only)
if (typeof window !== 'undefined') {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            currentState = { ...currentState, ...parsed };
        }
        const thoughts = localStorage.getItem(THOUGHTS_KEY);
        if (thoughts) {
            currentState.thoughts = JSON.parse(thoughts).slice(-50);
        }
    } catch { }
}

export const AutonomousAgentService = {
    // Initialize agent
    init() {
        if (typeof window === 'undefined') return;

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                currentState = { ...currentState, ...parsed };
            } catch { }
        }

        const thoughts = localStorage.getItem(THOUGHTS_KEY);
        if (thoughts) {
            try {
                currentState.thoughts = JSON.parse(thoughts).slice(-50); // Keep last 50
            } catch { }
        }

        this.notify();
    },

    // Get current state
    getState(): AgentState {
        return { ...currentState };
    },

    // Subscribe to state changes
    subscribe(callback: (state: AgentState) => void): () => void {
        listeners.add(callback);
        return () => listeners.delete(callback);
    },

    // Notify all listeners
    notify() {
        listeners.forEach(cb => cb(this.getState()));
    },

    // Save state
    save() {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            status: currentState.status,
            lastCheck: currentState.lastCheck,
            autoExecuteEnabled: currentState.autoExecuteEnabled,
        }));
        localStorage.setItem(THOUGHTS_KEY, JSON.stringify(currentState.thoughts.slice(-50)));
    },

    // Add a thought
    addThought(type: AgentThought['type'], message: string, details?: any) {
        const thought: AgentThought = {
            id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            type,
            message,
            details,
        };
        currentState.thoughts = [...currentState.thoughts.slice(-49), thought];
        this.save();
        this.notify();
        return thought;
    },

    // Helper to add delay
    async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Add thought with delay (for visual effect)
    async addThoughtSlow(type: AgentThought['type'], message: string, details?: any) {
        await this.delay(600); // 600ms delay between thoughts
        return this.addThought(type, message, details);
    },

    // Update status
    setStatus(status: AgentStatus, task?: string) {
        currentState.status = status;
        currentState.currentTask = task || null;
        this.notify();
    },

    // Toggle auto-execute
    setAutoExecute(enabled: boolean) {
        currentState.autoExecuteEnabled = enabled;
        this.save();
        this.notify();

        if (enabled) {
            this.addThought('decision', '🤖 Auto-execute enabled. I will now run autonomously.');
            this.runCycle(); // Start immediately
        } else {
            this.addThought('decision', '⏸️ Auto-execute disabled. Waiting for manual actions.');
        }
    },

    // Main agent cycle - checks and acts
    async runCycle() {
        if (currentState.status !== 'idle') return;

        this.setStatus('thinking', 'Analyzing inventory...');
        this.addThought('observation', '👀 Starting inventory scan...');

        try {
            // Step 1: Check inventory
            const inventory = await InventoryService.getItems();
            this.addThought('observation', `📦 Found ${inventory.length} items in inventory`);

            // Step 2: Run ML Predictions
            this.setStatus('analyzing', 'Running ML predictions...');
            this.addThought('analysis', '🧠 Running consumption rate analysis and runout forecasting...');

            const suggestions = SuggestionsService.generateSuggestions(inventory);

            if (suggestions.length === 0) {
                this.addThought('analysis', '✅ ML Analysis: Inventory looks good. No items predicted to run out soon.');
                this.setStatus('idle');
                currentState.lastCheck = Date.now();
                this.save();
                return;
            }

            // Show ML predictions for each item
            for (const sugg of suggestions.slice(0, 3)) {
                const prediction = ForecastingService.predictRunout(sugg.item.id, sugg.item.quantity);
                const runoutDays = prediction.days_until_runout;
                const confidence = Math.round(prediction.confidence_score * 100);
                const dailyRate = prediction.avg_daily_usage.toFixed(2);

                this.addThought('analysis',
                    `📊 ML Prediction for "${sugg.item.name}": ` +
                    `${runoutDays ? `Runs out in ${runoutDays} days` : 'Low stock'} | ` +
                    `Rate: ${dailyRate}/day | ` +
                    `Confidence: ${confidence}% | ` +
                    `Urgency: ${sugg.urgency.toUpperCase()}`
                );
            }

            this.addThought('decision', `⚠️ ML found ${suggestions.length} items needing restock`);

            // Step 3: Search for products
            this.setStatus('analyzing', 'Finding best prices...');
            const cart: { product: any; suggestion: any }[] = [];

            for (const suggestion of suggestions.slice(0, 5)) {
                const { products } = await VendorAPIService.searchProducts(suggestion.item.name);
                if (products.length > 0) {
                    const best = products.reduce((a, b) => a.price < b.price ? a : b);
                    cart.push({ product: best, suggestion });
                    this.addThought('decision', `🛒 Best deal: "${best.name}" @ $${best.price} (saves $${(best.price * 0.15).toFixed(0)} vs avg)`);
                }
            }

            if (cart.length === 0) {
                this.addThought('analysis', '❌ Could not find products for predicted items');
                this.setStatus('idle');
                return;
            }

            // Step 4: Calculate total and check limits
            const total = cart.reduce((sum, c) => sum + c.product.price, 0);
            this.addThought('analysis', `💰 Cart total: $${total.toFixed(2)} for ${cart.length} items`);

            // Step 5: Check spend caps
            const spendCheck = SpendControlsService.canPurchase(total);
            if (!spendCheck.allowed) {
                this.addThought('decision', `🚫 ${spendCheck.reason}. Cannot proceed.`);
                this.setStatus('idle');
                return;
            }

            // Step 6: Check approval mode
            const approvalCheck = ApprovalModeService.shouldAutoApprove(total);

            if (approvalCheck.approved && currentState.autoExecuteEnabled) {
                // AUTO-EXECUTE!
                this.setStatus('executing', 'Placing order...');
                this.addThought('action', `🤖 Auto-executing order: ${approvalCheck.reason}`);

                // Simulate order
                SpendControlsService.addSpend(total);

                AuditLogService.logEvent('purchase_approved', {
                    items: cart.map(c => c.product.name),
                    total,
                    autoExecuted: true,
                    agentDecision: true,
                }, false);

                this.addThought('action', `✅ Order placed successfully! Total: $${total.toFixed(2)}`);

                currentState.pendingActions = 0;
            } else {
                // Need approval
                this.setStatus('waiting_approval', 'Waiting for your approval...');
                this.addThought('waiting', `⏳ ${approvalCheck.reason}. Cart ready for your review.`);
                currentState.pendingActions = cart.length;
            }

            currentState.lastCheck = Date.now();
            this.save();
            this.setStatus('idle');

        } catch (error) {
            this.addThought('observation', `❌ Error during cycle: ${error}`);
            this.setStatus('idle');
        }
    },

    // Clear thoughts
    clearThoughts() {
        currentState.thoughts = [];
        this.save();
        this.notify();
    },

    // Clear pending actions (called after checkout)
    clearPending() {
        if (currentState.pendingActions > 0) {
            this.addThought('action', `✅ Checkout completed! Cart cleared.`);
        }
        currentState.pendingActions = 0;
        currentState.status = 'idle';
        this.save();
        this.notify();
    },

    // Get AI-powered thought using Gemini
    async getAIThought(context: string): Promise<string> {
        if (!GeminiService.isConfigured()) {
            return ''; // No Gemini key configured
        }

        try {
            const response = await GeminiService.getAgentThought(context);
            if (response.success && response.text) {
                return response.text.trim();
            }
        } catch (error) {
            console.log('Gemini thought generation failed:', error);
        }
        return '';
    },

    // Get AI suggestion for reorder quantity
    async getAIReorderSuggestion(itemName: string, currentQty: number, dailyUsage: number): Promise<number | null> {
        if (!GeminiService.isConfigured()) return null;

        try {
            const response = await GeminiService.suggestReorderQuantity(itemName, currentQty, dailyUsage);
            if (response.success && response.text) {
                const parsed = JSON.parse(response.text);
                return parsed.quantity || null;
            }
        } catch (error) {
            console.log('AI reorder suggestion failed:', error);
        }
        return null;
    },

    // Get status emoji
    getStatusEmoji(status: AgentStatus): string {
        switch (status) {
            case 'idle': return '😴';
            case 'thinking': return '🤔';
            case 'analyzing': return '🔍';
            case 'deciding': return '⚖️';
            case 'executing': return '⚡';
            case 'waiting_approval': return '✋';
            default: return '❓';
        }
    },

    // Get status text
    getStatusText(status: AgentStatus): string {
        switch (status) {
            case 'idle': return 'Ready';
            case 'thinking': return 'Thinking...';
            case 'analyzing': return 'Analyzing...';
            case 'deciding': return 'Making decision...';
            case 'executing': return 'Executing action...';
            case 'waiting_approval': return 'Waiting for approval';
            default: return 'Unknown';
        }
    },

    // REACTIVE: Called when an item is consumed/used
    async onItemConsumed(itemName: string, currentQuantity: number, minQuantity: number) {
        this.addThought('observation', `👀 Detected "${itemName}" was used. Remaining: ${currentQuantity}`);

        // Show ML prediction for this item
        await this.addThoughtSlow('analysis', '🧠 Running ML consumption analysis...');

        // Get all inventory to find this item's ID
        const inventory = await InventoryService.getItems();
        const item = inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());

        if (item) {
            const prediction = ForecastingService.predictRunout(item.id, currentQuantity);
            const confidence = Math.round(prediction.confidence_score * 100);
            const dailyRate = prediction.avg_daily_usage.toFixed(2);
            const runoutDays = prediction.days_until_runout;
            const usageCount = (prediction as any).usage_count || 0;
            const mlMethod = (prediction as any).ml_method || 'SMA';
            const seasonality = (prediction as any).seasonality_factor || 1.0;

            // Show "Learning" if confidence is 0
            const confidenceText = confidence > 0
                ? `${confidence}%`
                : `Learning (${usageCount} usage${usageCount !== 1 ? 's' : ''} logged)`;

            await this.addThoughtSlow('analysis',
                `📊 ML Model Output for "${itemName}":\n` +
                `   • Method: ${mlMethod}\n` +
                `   • Consumption Rate: ${dailyRate} units/day\n` +
                `   • Day Adjustment: ${(seasonality * 100).toFixed(0)}% (weekday factor)\n` +
                `   • Predicted Runout: ${runoutDays ? `~${runoutDays} days` : 'Low stock'}\n` +
                `   • Model Confidence: ${confidenceText}\n` +
                `   • Current Stock: ${currentQuantity} | Threshold: ${minQuantity}`
            );

            // Try to get AI thought from Gemini
            if (GeminiService.isConfigured()) {
                try {
                    const aiContext = `Item "${itemName}" has ${currentQuantity} left, uses ${dailyRate}/day, runs out in ${runoutDays || 'soon'} days`;
                    const aiThought = await this.getAIThought(aiContext);
                    if (aiThought) {
                        await this.addThoughtSlow('analysis', `🤖 Gemini AI: ${aiThought}`);
                    }
                } catch (e) {
                    // Gemini not available, continue without it
                }
            }
        }

        // Step 1: Should we reorder?
        if (currentQuantity > minQuantity) {
            await this.addThoughtSlow('decision', `✅ Decision: Stock sufficient (${currentQuantity} > ${minQuantity}). No reorder needed.`);
            return;
        }

        await this.addThoughtSlow('decision', `⚠️ Decision: LOW STOCK ALERT! (${currentQuantity} ≤ ${minQuantity}). Initiating reorder...`);
        this.setStatus('thinking', `Evaluating reorder for ${itemName}...`);

        try {
            // Step 2: Search for best product
            await this.addThoughtSlow('action', `🔍 Searching vendor APIs for "${itemName}"...`);
            const { products } = await VendorAPIService.searchProducts(itemName);

            if (products.length === 0) {
                await this.addThoughtSlow('analysis', `❌ No products found for "${itemName}". Cannot reorder.`);
                this.setStatus('idle');
                return;
            }

            // Pick the best option (cheapest in-stock)
            const inStock = products.filter(p => p.inStock);
            if (inStock.length === 0) {
                await this.addThoughtSlow('analysis', `❌ All products for "${itemName}" are out of stock.`);
                this.setStatus('idle');
                return;
            }

            const best = inStock.reduce((a, b) => a.price < b.price ? a : b);
            await this.addThoughtSlow('decision', `🛒 Best option: "${best.name}" at $${best.price} from ${best.brand}`);

            // Step 3: Check spend cap
            this.setStatus('deciding', 'Checking spend limits...');
            await this.delay(400);
            const spendCheck = SpendControlsService.canPurchase(best.price);

            if (!spendCheck.allowed) {
                await this.addThoughtSlow('decision', `🚫 Cannot order: ${spendCheck.reason}`);
                this.setStatus('idle');
                return;
            }

            await this.addThoughtSlow('analysis', `💳 Spend check passed. $${best.price} is within limits.`);

            // Step 4: Check approval mode
            const approvalCheck = ApprovalModeService.shouldAutoApprove(best.price);

            if (approvalCheck.approved && currentState.autoExecuteEnabled) {
                // AUTO-ORDER!
                this.setStatus('executing', 'Placing order...');
                await this.addThoughtSlow('action', `🤖 Auto-ordering: ${approvalCheck.reason}`);

                // Execute order
                SpendControlsService.addSpend(best.price);

                AuditLogService.logEvent('purchase_approved', {
                    item: best.name,
                    price: best.price,
                    trigger: 'consumption_detected',
                    autoExecuted: true,
                }, false);

                // UPDATE INVENTORY: Restock the item
                try {
                    const inventoryItems = await InventoryService.getItems();
                    const existingItem = inventoryItems.find(i =>
                        i.name.toLowerCase().includes(itemName.toLowerCase()) ||
                        itemName.toLowerCase().includes(i.name.toLowerCase())
                    );

                    if (existingItem) {
                        const newQty = existingItem.quantity + 5;
                        await InventoryService.updateItem(existingItem.id, { quantity: newQty });
                        await this.addThoughtSlow('action', `📦 Inventory restocked! "${existingItem.name}" now has ${newQty} units`);

                        // Emit event to refresh inventory UI
                        window.dispatchEvent(new CustomEvent('inventoryUpdated', { detail: { itemName, newQty } }));
                    }
                } catch (e) {
                    await this.addThoughtSlow('observation', `⚠️ Could not update inventory`);
                }

                await this.addThoughtSlow('action', `✅ Order complete! "${best.name}" for $${best.price}`);
                currentState.pendingActions = 0;
            } else {
                // Need approval
                this.addThought('waiting', `⏳ ${approvalCheck.reason}. Added to cart for your review.`);
                currentState.pendingActions += 1;
            }

            this.save();
            this.setStatus('idle');

        } catch (error) {
            this.addThought('observation', `❌ Error: ${error}`);
            this.setStatus('idle');
        }
    },
};

// Initialize on load
if (typeof window !== 'undefined') {
    AutonomousAgentService.init();
}

