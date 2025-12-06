'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateItemDTO, Category } from '@/types/inventory';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { GeminiService } from '@/services/gemini';

const ReceiptScanner = dynamic(() => import('./ReceiptScanner').then(mod => mod.ReceiptScanner), { ssr: false });
const CameraScanner = dynamic(() => import('./CameraScanner').then(mod => mod.CameraScanner), { ssr: false });
const EmailScanner = dynamic(() => import('./EmailScanner').then(mod => mod.EmailScanner), { ssr: false });

interface AddItemDialogProps {
    onAdd: (item: CreateItemDTO) => Promise<void>;
}

export function AddItemDialog({ onAdd }: AddItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('manual');
    const [aiSuggesting, setAiSuggesting] = useState(false);
    const [aiSuggested, setAiSuggested] = useState(false);
    const [formData, setFormData] = useState<CreateItemDTO>({
        name: '',
        category: 'Pantry',
        quantity: 1,
        unit: 'pcs',
        expiry_date: '',
    });

    // AI auto-categorization when item name changes
    const autoCategorize = useCallback(async (itemName: string) => {
        if (!itemName || itemName.length < 2 || !GeminiService.isConfigured()) return;

        setAiSuggesting(true);
        try {
            const response = await GeminiService.categorizeItem(itemName);
            if (response.success && response.text) {
                let jsonText = response.text.trim();
                if (jsonText.startsWith('```')) {
                    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
                }
                const parsed = JSON.parse(jsonText);
                if (parsed.category) {
                    setFormData(prev => ({
                        ...prev,
                        category: parsed.category as Category,
                        unit: parsed.unit || prev.unit,
                    }));
                    setAiSuggested(true);
                }
            }
        } catch (e) {
            console.log('AI categorization failed:', e);
        } finally {
            setAiSuggesting(false);
        }
    }, []);

    // Debounce the auto-categorize
    useEffect(() => {
        if (!formData.name || formData.name.length < 3) {
            setAiSuggested(false);
            return;
        }

        const timer = setTimeout(() => {
            autoCategorize(formData.name);
        }, 800); // Wait 800ms after typing stops

        return () => clearTimeout(timer);
    }, [formData.name, autoCategorize]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onAdd(formData);
            setOpen(false);
            setFormData({
                name: '',
                category: 'Pantry',
                quantity: 1,
                unit: 'pcs',
                expiry_date: '',
            });
            setAiSuggested(false);
        } catch (error) {
            console.error('Failed to add item', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                    <DialogDescription>
                        Add items manually, scan a receipt, or use the camera.
                        {GeminiService.isConfigured() && (
                            <span className="ml-2 inline-flex items-center gap-1 text-purple-600">
                                <Sparkles className="h-3 w-3" /> AI-powered
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="manual">Manual</TabsTrigger>
                        <TabsTrigger value="receipt">Receipt</TabsTrigger>
                        <TabsTrigger value="camera">Camera</TabsTrigger>
                        <TabsTrigger value="email">Email</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual">
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Name
                                    </Label>
                                    <div className="col-span-3 relative">
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Milk, Eggs, Bread..."
                                            required
                                        />
                                        {aiSuggesting && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="category" className="text-right flex items-center gap-1">
                                        Category
                                        {aiSuggested && (
                                            <Sparkles className="h-3 w-3 text-purple-500" />
                                        )}
                                    </Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => {
                                            setFormData({ ...formData, category: value as Category });
                                            setAiSuggested(false);
                                        }}
                                    >
                                        <SelectTrigger className={`col-span-3 ${aiSuggested ? 'border-purple-300 bg-purple-50' : ''}`}>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Produce">Produce</SelectItem>
                                            <SelectItem value="Dairy">Dairy</SelectItem>
                                            <SelectItem value="Meat">Meat</SelectItem>
                                            <SelectItem value="Pantry">Pantry</SelectItem>
                                            <SelectItem value="Beverages">Beverages</SelectItem>
                                            <SelectItem value="Household">Household</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {aiSuggested && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <div></div>
                                        <div className="col-span-3 text-xs text-purple-600 flex items-center gap-1">
                                            <Sparkles className="h-3 w-3" />
                                            AI suggested category & unit
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="quantity" className="text-right">
                                        Quantity
                                    </Label>
                                    <div className="col-span-3 flex gap-2">
                                        <Input
                                            id="quantity"
                                            type="number"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                            className="w-20"
                                            min={1}
                                        />
                                        <Input
                                            placeholder="Unit (e.g., pcs, kg)"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            className={`flex-1 ${aiSuggested ? 'border-purple-300 bg-purple-50' : ''}`}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="expiry" className="text-right">
                                        Expiry
                                    </Label>
                                    <Input
                                        id="expiry"
                                        type="date"
                                        value={formData.expiry_date}
                                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Adding...' : 'Add Item'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="receipt" className="space-y-4">
                        <ReceiptScanner onScanComplete={(text, items) => {
                            if (items && items.length > 0) {
                                console.log('Parsed items:', items);
                                setFormData({
                                    ...formData,
                                    name: items[0].name,
                                    category: (items[0].category as Category) || 'Pantry',
                                    quantity: items[0].quantity || 1,
                                    unit: 'pcs'
                                });
                            } else {
                                const firstLine = text.split('\n')[0];
                                setFormData({ ...formData, name: firstLine || 'Scanned Receipt Item' });
                            }
                            setActiveTab('manual');
                        }} />
                        <p className="text-xs text-gray-500 text-center">
                            Upload a receipt image. AI will extract items automatically.
                        </p>
                    </TabsContent>

                    <TabsContent value="camera">
                        <CameraScanner onScanComplete={(detected) => {
                            setFormData({ ...formData, name: detected, category: 'Produce' });
                            setActiveTab('manual');
                        }} />
                    </TabsContent>

                    <TabsContent value="email" className="space-y-4">
                        <EmailScanner onItemsParsed={async (items) => {
                            if (items.length > 0) {
                                console.log('📧 Adding', items.length, 'items from email');
                                setLoading(true);

                                // Add ALL items from email
                                for (const item of items) {
                                    await onAdd({
                                        name: item.name,
                                        category: (item.category as Category) || 'Pantry',
                                        quantity: item.quantity || 1,
                                        unit: 'pcs',
                                        expiry_date: '',
                                    });
                                }

                                setLoading(false);
                                setOpen(false); // Close dialog after adding all
                                console.log('✅ Added', items.length, 'items from email');
                            }
                        }} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
