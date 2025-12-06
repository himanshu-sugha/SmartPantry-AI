'use client'

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { InventoryItem, CreateItemDTO, Category } from '@/types/inventory';
import { InventoryService } from '@/services/inventory';
import { InventoryItemCard } from './InventoryItemCard';
import { AddItemDialog } from './AddItemDialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export function InventoryList() {
    const searchParams = useSearchParams();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});

    // Initialize search from URL params
    useEffect(() => {
        const urlSearch = searchParams.get('search');
        if (urlSearch) {
            setSearch(urlSearch);
        }
    }, [searchParams]);

    useEffect(() => {
        loadItems();

        // Listen for inventory updates from agent
        const handleInventoryUpdate = () => {
            loadItems();
        };
        window.addEventListener('inventoryUpdated', handleInventoryUpdate);

        return () => {
            window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
        };
    }, []);

    const loadItems = async () => {
        try {
            const data = await InventoryService.getItems();
            setItems(data);
        } catch (error) {
            console.error('Failed to load items', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (newItem: CreateItemDTO) => {
        try {
            const itemWithUser = { ...newItem, user_id: 'user-123' };
            const addedItem = await InventoryService.addItem(itemWithUser);

            const { AuditLogService } = await import('@/services/auditLog');
            AuditLogService.logEvent('item_added', {
                item_name: addedItem.name,
                category: addedItem.category,
                quantity: addedItem.quantity,
            }, true);

            loadItems();
        } catch (error) {
            console.error('Failed to add item', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await InventoryService.deleteItem(id);
            loadItems();
        } catch (error) {
            console.error('Failed to delete item', error);
        }
    };

    const handleEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setEditForm({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            expiry_date: item.expiry_date,
        });
    };

    const handleUpdate = async () => {
        if (!editingItem) return;

        try {
            await InventoryService.updateItem(editingItem.id, editForm);

            const { AuditLogService } = await import('@/services/auditLog');
            AuditLogService.logEvent('item_consumed', {
                item_name: editForm.name,
                quantity_used: 0,
                remaining: editForm.quantity,
            }, true);

            setEditingItem(null);
            loadItems();
        } catch (error) {
            console.error('Failed to update item', error);
        }
    };

    const handleConsume = async (id: string, quantity: number) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        const newQuantity = Math.max(0, item.quantity - quantity);

        await InventoryService.updateItem(id, { quantity: newQuantity });

        try {
            const { AgentEventBus } = await import('@/services/agentEventBus');
            AgentEventBus.logItemConsumed(item.name, quantity, newQuantity);
        } catch (e) { }

        const { ConsumptionService } = await import('@/services/consumption');
        ConsumptionService.logConsumption(id, item.name, quantity);

        try {
            const { BlockchainService } = await import('@/services/blockchain');
            BlockchainService.recordAction('item_consumed', {
                itemName: item.name,
                quantity
            });

            if (item.expiry_date) {
                const expiry = new Date(item.expiry_date);
                const now = new Date();
                const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
                    BlockchainService.recordAction('waste_prevented', {
                        itemName: item.name,
                        daysUntilExpiry
                    });
                }
            }
        } catch (e) { }

        const { AuditLogService } = await import('@/services/auditLog');
        AuditLogService.logEvent('item_consumed', {
            item_name: item.name,
            quantity_used: quantity,
            remaining: newQuantity,
        }, true);

        try {
            const { AutonomousAgentService } = await import('@/services/autonomousAgent');
            AutonomousAgentService.onItemConsumed(item.name, newQuantity, item.min_quantity || 2);
        } catch (e) {
            console.log('Agent not triggered:', e);
        }

        loadItems();
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    const categories: Category[] = ['Produce', 'Dairy', 'Meat', 'Pantry', 'Beverages', 'Household', 'Other'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search pantry..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <AddItemDialog onAdd={handleAddItem} />
            </div>

            {loading ? (
                <div className="text-center py-12">Loading inventory...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => (
                        <InventoryItemCard
                            key={item.id}
                            item={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onConsume={handleConsume}
                        />
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No items found. Click &quot;Add Item&quot; to get started!
                        </div>
                    )}
                </div>
            )}

            {/* Edit Item Dialog */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Item</DialogTitle>
                        <DialogDescription>
                            Update the item details below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name || ''}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-category" className="text-right">Category</Label>
                            <Select
                                value={editForm.category}
                                onValueChange={(value: Category) => setEditForm({ ...editForm, category: value })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-quantity" className="text-right">Quantity</Label>
                            <Input
                                id="edit-quantity"
                                type="number"
                                value={editForm.quantity || 0}
                                onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-unit" className="text-right">Unit</Label>
                            <Input
                                id="edit-unit"
                                value={editForm.unit || ''}
                                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-expiry" className="text-right">Expiry</Label>
                            <Input
                                id="edit-expiry"
                                type="date"
                                value={editForm.expiry_date || ''}
                                onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                        <Button onClick={handleUpdate}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
