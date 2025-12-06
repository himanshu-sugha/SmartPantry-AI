
import { InventoryItem } from '@/types/inventory';

export interface CartItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    retailer: 'Amazon' | 'Walmart';
    image_url?: string;
}

export const CartService = {
    async generateCart(inventory: InventoryItem[]): Promise<CartItem[]> {
        // Logic: Find items with low quantity
        const lowStockItems = inventory.filter(item => item.quantity <= 2);

        // Mock API call to Amazon/Walmart to get prices and products
        const cartItems: CartItem[] = lowStockItems.map(item => ({
            id: `cart-${item.id}`,
            name: item.name,
            quantity: 1, // Default reorder quantity
            price: Math.floor(Math.random() * 10) + 2.99, // Mock price
            retailer: Math.random() > 0.5 ? 'Amazon' : 'Walmart',
            image_url: item.image_url,
        }));

        return cartItems;
    },

    async checkout(items: CartItem[]): Promise<string> {
        // Mock checkout process
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('order-123-456');
            }, 2000);
        });
    }
};
