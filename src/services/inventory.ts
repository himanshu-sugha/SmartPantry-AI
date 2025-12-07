import { InventoryItem, CreateItemDTO } from '@/types/inventory';
import { BlockchainService } from './blockchain';
import { AgentEventBus } from './agentEventBus';

const STORAGE_KEY = 'smartpantry_inventory';

// Mock inventory service using localStorage
export const InventoryService = {
    // Get all items
    async getItems(): Promise<InventoryItem[]> {
        if (typeof window === 'undefined') return [];

        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            return [];
        }

        try {
            const items = JSON.parse(data);
            return items.sort((a: InventoryItem, b: InventoryItem) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        } catch (error) {
            console.error('Failed to parse inventory data:', error);
            AgentEventBus.logError('Inventory', 'Failed to parse inventory data');
            return [];
        }
    },

    // Add item
    async addItem(item: CreateItemDTO & { user_id: string }): Promise<InventoryItem> {
        const newItem: InventoryItem = {
            ...item,
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString(),
        };

        const items = await this.getItems();
        items.unshift(newItem);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

        // Log to Agent
        AgentEventBus.logItemAdded(item.name, item.quantity);

        // Earn PantryPoints for adding item
        try {
            BlockchainService.recordAction('item_added', { itemName: item.name });
        } catch (e) {
            // Wallet may not be connected
        }

        return newItem;
    },

    // Update item
    async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
        const items = await this.getItems();
        const index = items.findIndex(item => item.id === id);

        if (index === -1) return null;

        const oldItem = items[index];
        items[index] = { ...items[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

        // Log to Agent
        const changes = Object.keys(updates).map(k => `${k}: ${(updates as any)[k]}`).join(', ');
        AgentEventBus.logItemUpdated(oldItem.name, changes);

        return items[index];
    },

    // Delete item
    async deleteItem(id: string): Promise<void> {
        const items = await this.getItems();
        const itemToDelete = items.find(item => item.id === id);
        const filtered = items.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

        // Log to Agent
        if (itemToDelete) {
            AgentEventBus.logItemDeleted(itemToDelete.name);
        }
    },

    // Get item by ID
    async getItemById(id: string): Promise<InventoryItem | null> {
        const items = await this.getItems();
        return items.find(item => item.id === id) || null;
    },

    // Clear all items (for testing)
    async clearAll(): Promise<void> {
        localStorage.removeItem(STORAGE_KEY);
    },

    // Update item quantity (e.g. after purchase)
    async updateQuantity(id: string, delta: number): Promise<void> {
        const items = await this.getItems();
        const index = items.findIndex(item => item.id === id);

        if (index !== -1) {
            items[index].quantity += delta;
            items[index].updated_at = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
    },
};
