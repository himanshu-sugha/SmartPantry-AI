import { InventoryItem, CreateItemDTO } from '@/types/inventory';
import { BlockchainService } from './blockchain';
import { AgentEventBus } from './agentEventBus';
import { SecureStorage } from './secureStorage';

const STORAGE_KEY = 'smartpantry_inventory';
const USE_ENCRYPTION = true; // Enable AES-256-GCM encryption

// Inventory service with AES-256-GCM encrypted storage
export const InventoryService = {
    // Get all items (from encrypted storage)
    async getItems(): Promise<InventoryItem[]> {
        if (typeof window === 'undefined') return [];

        try {
            // Try encrypted storage first
            if (USE_ENCRYPTION) {
                const encryptedData = await SecureStorage.getItem<InventoryItem[]>(STORAGE_KEY);
                if (encryptedData) {
                    return encryptedData.sort((a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                }
            }

            // Fallback to plain localStorage (for migration)
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const items = JSON.parse(data);
                // Migrate to encrypted storage
                if (USE_ENCRYPTION) {
                    await SecureStorage.setItem(STORAGE_KEY, items);
                    console.log('📦 Inventory migrated to encrypted storage');
                }
                return items.sort((a: InventoryItem, b: InventoryItem) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            }

            return [];
        } catch (error) {
            console.error('Failed to load inventory:', error);
            AgentEventBus.logError('Inventory', 'Failed to decrypt inventory data');
            return [];
        }
    },

    // Save items (to encrypted storage)
    async saveItems(items: InventoryItem[]): Promise<void> {
        if (USE_ENCRYPTION) {
            await SecureStorage.setItem(STORAGE_KEY, items);
        } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
        await this.saveItems(items);

        // Log to Agent
        AgentEventBus.logItemAdded(item.name, item.quantity);

        // Earn PantryPoints
        try {
            BlockchainService.recordAction('item_added', { itemName: item.name });
        } catch (e) { }

        return newItem;
    },

    // Update item
    async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
        const items = await this.getItems();
        const index = items.findIndex(item => item.id === id);

        if (index === -1) return null;

        const oldItem = items[index];
        items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() };
        await this.saveItems(items);

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
        await this.saveItems(filtered);

        if (itemToDelete) {
            AgentEventBus.logItemDeleted(itemToDelete.name);
        }
    },

    // Get item by ID
    async getItemById(id: string): Promise<InventoryItem | null> {
        const items = await this.getItems();
        return items.find(item => item.id === id) || null;
    },

    // Clear all items
    async clearAll(): Promise<void> {
        SecureStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
    },

    // Update item quantity (after purchase)
    async updateQuantity(id: string, delta: number): Promise<void> {
        const items = await this.getItems();
        const index = items.findIndex(item => item.id === id);

        if (index !== -1) {
            items[index].quantity += delta;
            items[index].updated_at = new Date().toISOString();
            await this.saveItems(items);
        }
    },

    // Get encryption status
    getEncryptionStatus(): { enabled: boolean; algorithm: string } {
        const status = SecureStorage.getStatus();
        return {
            enabled: USE_ENCRYPTION && status.enabled,
            algorithm: status.algorithm,
        };
    },
};

