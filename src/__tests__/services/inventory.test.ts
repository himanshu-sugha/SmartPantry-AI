/**
 * SmartPantry AI - Inventory Service Tests
 * Tests for CRUD operations and inventory management
 */

import { InventoryService } from '@/services/inventory';

describe('InventoryService', () => {
    beforeEach(() => {
        // Clear localStorage mock before each test
        jest.clearAllMocks();
        (localStorage.getItem as jest.Mock).mockReturnValue(null);
    });

    describe('getItems', () => {
        it('should return empty array when no items exist', async () => {
            const items = await InventoryService.getItems();
            expect(items).toEqual([]);
        });

        it('should return stored items when they exist', async () => {
            const mockItems = [
                { id: 'item-1', name: 'Milk', quantity: 2, unit: 'gallon', category: 'Dairy', created_at: new Date().toISOString() },
            ];
            (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockItems));

            const items = await InventoryService.getItems();
            expect(items).toHaveLength(1);
            expect(items[0].name).toBe('Milk');
        });
    });

    describe('addItem', () => {
        it('should add a new item to inventory', async () => {
            (localStorage.getItem as jest.Mock).mockReturnValue('[]');

            const newItem = await InventoryService.addItem({
                name: 'Eggs',
                quantity: 12,
                unit: 'count',
                category: 'Dairy',
                user_id: 'test-user',
            });

            expect(newItem.name).toBe('Eggs');
            expect(newItem.quantity).toBe(12);
            expect(newItem.id).toBeDefined();
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('updateItem', () => {
        it('should update an existing item', async () => {
            const mockItems = [
                { id: 'item-1', name: 'Milk', quantity: 2, unit: 'gallon', category: 'Dairy', created_at: new Date().toISOString() },
            ];
            (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockItems));

            const updated = await InventoryService.updateItem('item-1', { quantity: 3 });
            expect(updated?.quantity).toBe(3);
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        it('should return null for non-existent item', async () => {
            (localStorage.getItem as jest.Mock).mockReturnValue('[]');

            const updated = await InventoryService.updateItem('non-existent', { quantity: 3 });
            expect(updated).toBeNull();
        });
    });

    describe('deleteItem', () => {
        it('should delete an existing item', async () => {
            const mockItems = [
                { id: 'item-1', name: 'Milk', quantity: 2, unit: 'gallon', category: 'Dairy', created_at: new Date().toISOString() },
                { id: 'item-2', name: 'Bread', quantity: 1, unit: 'loaf', category: 'Bakery', created_at: new Date().toISOString() },
            ];
            (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockItems));

            await InventoryService.deleteItem('item-1');
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });
});
