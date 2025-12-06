// Client-side Vendor API service
// Interacts with our mock vendor API via HTTP - just like a real vendor API

export interface VendorProduct {
    id: string;
    name: string;
    price: number;
    mrp: number;
    brand: string;
    category: string;
    image: string;
    stock: number;
    rating: number;
    reviews: number;
    inStock: boolean;
    discount: number;
}

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

export interface Cart {
    id: string;
    items: CartItem[];
    total: number;
    itemCount: number;
}

export interface Order {
    id: string;
    items: CartItem[];
    total: number;
    status: string;
    paymentMethod: string;
    shippingAddress: string;
    createdAt: string;
    estimatedDelivery: string;
}

// Generate a unique cart ID for this session
const getCartId = (): string => {
    if (typeof window === 'undefined') return 'server-cart';

    let cartId = localStorage.getItem('vendor_cart_id');
    if (!cartId) {
        cartId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('vendor_cart_id', cartId);
    }
    return cartId;
};

import { GeminiService } from './gemini';

export const VendorAPIService = {
    // Search products - AI-powered with mock fallback
    async searchProducts(query: string, options?: {
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        limit?: number;
        offset?: number;
        useAI?: boolean; // Enable AI product generation
    }): Promise<{ products: VendorProduct[]; total: number; aiGenerated?: boolean }> {
        const limit = options?.limit || 20;

        // Try AI-powered product generation first
        if (GeminiService.isConfigured() && options?.useAI !== false) {
            try {
                console.log('🤖 Trying AI product generation for:', query);
                const aiResponse = await GeminiService.generateProducts(query, Math.min(limit, 8));

                if (aiResponse.success && aiResponse.text) {
                    let jsonText = aiResponse.text.trim();
                    // Clean markdown code blocks
                    if (jsonText.startsWith('```')) {
                        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
                    }

                    const aiProducts = JSON.parse(jsonText);
                    if (Array.isArray(aiProducts) && aiProducts.length > 0) {
                        // Ensure all products have required fields
                        const products: VendorProduct[] = aiProducts.map((p: any, idx: number) => ({
                            id: p.id || `ai_${Date.now()}_${idx}`,
                            name: p.name || query,
                            price: p.price || 50,
                            mrp: p.mrp || p.price || 50,
                            brand: p.brand || 'Generic',
                            category: p.category || 'Pantry',
                            image: p.image || `https://via.placeholder.com/150?text=${encodeURIComponent(p.name || query)}`,
                            stock: p.stock || 50,
                            rating: p.rating || 4.0,
                            reviews: p.reviews || Math.floor(Math.random() * 5000),
                            inStock: p.inStock !== false,
                            discount: p.discount || 0,
                        }));

                        console.log('✅ AI generated', products.length, 'products');
                        return { products, total: products.length, aiGenerated: true };
                    }
                }
            } catch (error) {
                console.log('⚠️ AI generation failed, falling back to mock API:', error);
            }
        }

        // Fallback to mock API
        try {
            const params = new URLSearchParams({
                action: 'search',
                query,
                ...(options?.category && { category: options.category }),
                ...(options?.minPrice && { minPrice: String(options.minPrice) }),
                ...(options?.maxPrice && { maxPrice: String(options.maxPrice) }),
                limit: String(limit),
                offset: String(options?.offset || 0),
            });

            const response = await fetch(`/api/vendor?${params}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Search failed');
            }

            return { products: data.products, total: data.total, aiGenerated: false };
        } catch (error) {
            console.error('Vendor search error:', error);
            return { products: [], total: 0, aiGenerated: false };
        }
    },


    // Get product by ID
    async getProduct(productId: string): Promise<VendorProduct | null> {
        try {
            const response = await fetch(`/api/vendor?action=product&id=${productId}`);
            const data = await response.json();

            if (!data.success) return null;
            return data.product;
        } catch (error) {
            console.error('Get product error:', error);
            return null;
        }
    },

    // Get all categories
    async getCategories(): Promise<{ name: string; count: number }[]> {
        try {
            const response = await fetch('/api/vendor?action=categories');
            const data = await response.json();

            if (!data.success) return [];
            return data.categories;
        } catch (error) {
            console.error('Get categories error:', error);
            return [];
        }
    },

    // Get trending products
    async getTrending(): Promise<VendorProduct[]> {
        try {
            const response = await fetch('/api/vendor?action=trending');
            const data = await response.json();

            if (!data.success) return [];
            return data.products;
        } catch (error) {
            console.error('Get trending error:', error);
            return [];
        }
    },

    // Get current cart
    async getCart(): Promise<Cart> {
        try {
            const cartId = getCartId();
            const response = await fetch(`/api/vendor?action=cart&cartId=${cartId}`);
            const data = await response.json();

            if (!data.success) {
                return { id: cartId, items: [], total: 0, itemCount: 0 };
            }
            return data.cart;
        } catch (error) {
            console.error('Get cart error:', error);
            return { id: getCartId(), items: [], total: 0, itemCount: 0 };
        }
    },

    // Add item to cart
    async addToCart(productId: string, quantity: number = 1): Promise<Cart | null> {
        try {
            const response = await fetch('/api/vendor?action=cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cartId: getCartId(),
                    productId,
                    quantity,
                }),
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error);
            }
            return data.cart;
        } catch (error) {
            console.error('Add to cart error:', error);
            return null;
        }
    },

    // Update cart item quantity
    async updateCartItem(productId: string, quantity: number): Promise<Cart | null> {
        try {
            const response = await fetch('/api/vendor?action=cart/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cartId: getCartId(),
                    productId,
                    quantity,
                }),
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error);
            }
            return data.cart;
        } catch (error) {
            console.error('Update cart error:', error);
            return null;
        }
    },

    // Clear cart
    async clearCart(): Promise<boolean> {
        try {
            const response = await fetch('/api/vendor?action=cart/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartId: getCartId() }),
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Clear cart error:', error);
            return false;
        }
    },

    // Checkout
    async checkout(shippingAddress?: string, paymentMethod?: string): Promise<Order | null> {
        try {
            const response = await fetch('/api/vendor?action=checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cartId: getCartId(),
                    shippingAddress,
                    paymentMethod: paymentMethod || 'cod',
                }),
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error);
            }

            // Clear local cart ID after successful checkout
            localStorage.removeItem('vendor_cart_id');

            return data.order;
        } catch (error) {
            console.error('Checkout error:', error);
            return null;
        }
    },

    // Get order by ID
    async getOrder(orderId: string): Promise<Order | null> {
        try {
            const response = await fetch(`/api/vendor?action=order&orderId=${orderId}`);
            const data = await response.json();

            if (!data.success) return null;
            return data.order;
        } catch (error) {
            console.error('Get order error:', error);
            return null;
        }
    },

    // Convert to our standard Product format (for compatibility)
    toProduct(vp: VendorProduct) {
        return {
            id: vp.id,
            name: vp.name,
            price: vp.price,
            retailer: vp.brand as any,
            category: vp.category,
            image_url: vp.image,
            in_stock: vp.inStock,
            rating: vp.rating,
            reviews: vp.reviews,
        };
    },
};
