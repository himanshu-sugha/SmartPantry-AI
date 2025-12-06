
import { InventoryItem } from '@/types/inventory';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { ConsumptionTracker } from './ConsumptionTracker';

interface InventoryItemProps {
    item: InventoryItem;
    onEdit: (item: InventoryItem) => void;
    onDelete: (id: string) => void;
    onConsume?: (id: string, quantity: number) => void;
}

// Get category emoji for fallback
const getCategoryEmoji = (category: string): string => {
    const lower = category.toLowerCase();
    if (lower.includes('dairy')) return '🥛';
    if (lower.includes('produce') || lower.includes('vegetable')) return '🥬';
    if (lower.includes('fruit')) return '🍎';
    if (lower.includes('meat') || lower.includes('protein')) return '🍗';
    if (lower.includes('grain') || lower.includes('bread')) return '🍞';
    if (lower.includes('beverage') || lower.includes('drink')) return '🥤';
    if (lower.includes('snack')) return '🍪';
    if (lower.includes('frozen')) return '🧊';
    if (lower.includes('pantry')) return '🥫';
    return '📦';
};

// Generate image URL using Unsplash Source API (free, no key needed)
const getItemImageUrl = (name: string): string => {
    const cleanName = encodeURIComponent(name.split(' ').slice(0, 2).join(' '));
    return `https://source.unsplash.com/200x150/?food,${cleanName}`;
};

export function InventoryItemCard({ item, onEdit, onDelete, onConsume }: InventoryItemProps) {
    const isLowStock = item.quantity <= 2;
    const isExpiringSoon = item.expiry_date
        ? new Date(item.expiry_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : false;

    const imageUrl = item.image_url || getItemImageUrl(item.name);
    const emoji = getCategoryEmoji(item.category);

    return (
        <Card className="overflow-hidden">
            <div className="relative h-32 w-full bg-gradient-to-br from-gray-100 to-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to emoji on error
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="flex h-full items-center justify-center text-5xl">${emoji}</div>`;
                    }}
                />
                <div className="absolute right-2 top-2 flex gap-1">
                    {isLowStock && <Badge variant="destructive">Low Stock</Badge>}
                    {isExpiringSoon && <Badge variant="secondary" className="bg-amber-100 text-amber-800">Expiring</Badge>}
                </div>
            </div>
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xl font-bold">{item.quantity}</span>
                        <span className="text-sm text-gray-500 ml-1">{item.unit}</span>
                    </div>
                </div>
                {item.expiry_date && (
                    <p className="mt-2 text-xs text-gray-400">
                        Expires: {new Date(item.expiry_date).toLocaleDateString()}
                    </p>
                )}
            </CardContent>
            <CardFooter className="bg-gray-50 p-2 flex justify-end gap-2">
                {onConsume && (
                    <ConsumptionTracker
                        itemId={item.id}
                        itemName={item.name}
                        currentQuantity={item.quantity}
                        onConsume={(qty) => onConsume(item.id, qty)}
                    />
                )}
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Edit className="h-4 w-4 text-gray-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </CardFooter>
        </Card>
    );
}
