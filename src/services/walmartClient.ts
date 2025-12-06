// Client-side Walmart API service
// Calls the server-side API route to fetch real Walmart products

export interface WalmartProductClient {
    id: string;
    name: string;
    price: number;
    retailer: 'Walmart';
    category: string;
    image_url: string;
    in_stock: boolean;
    rating: number;
    reviews: number;
    productUrl?: string;
}

export const WalmartClientService = {
    // Check if Walmart API is configured (call a simple endpoint)
    async isConfigured(): Promise<boolean> {
        try {
            const response = await fetch('/api/walmart?action=search&query=test');
            const data = await response.json();
            return !data.error || data.configured !== false;
        } catch {
            return false;
        }
    },

    // Search Walmart products
    async searchProducts(query: string): Promise<WalmartProductClient[]> {
        try {
            const response = await fetch(
                `/api/walmart?action=search&query=${encodeURIComponent(query)}`
            );

            if (!response.ok) {
                console.warn('Walmart API not available, using mock data');
                return [];
            }

            const data = await response.json();

            if (data.error) {
                console.warn('Walmart API error:', data.error);
                return [];
            }

            // Convert Walmart API response to our format
            const items = data.items || [];
            return items.map((item: any) => this.convertProduct(item));
        } catch (error) {
            console.error('Failed to fetch from Walmart:', error);
            return [];
        }
    },

    // Lookup product by item ID
    async lookupProduct(itemId: string): Promise<WalmartProductClient | null> {
        try {
            const response = await fetch(
                `/api/walmart?action=lookup&itemId=${itemId}`
            );

            if (!response.ok) return null;

            const data = await response.json();
            if (data.error) return null;

            return this.convertProduct(data);
        } catch (error) {
            console.error('Failed to lookup Walmart product:', error);
            return null;
        }
    },

    // Lookup by UPC/barcode
    async lookupByUPC(upc: string): Promise<WalmartProductClient | null> {
        try {
            const response = await fetch(
                `/api/walmart?action=upc&upc=${upc}`
            );

            if (!response.ok) return null;

            const data = await response.json();
            if (data.error || !data.items?.[0]) return null;

            return this.convertProduct(data.items[0]);
        } catch (error) {
            console.error('Failed to lookup by UPC:', error);
            return null;
        }
    },

    // Convert Walmart API response to our product format
    convertProduct(item: any): WalmartProductClient {
        return {
            id: `walmart-${item.itemId || item.usItemId || Date.now()}`,
            name: item.name || item.productName || 'Unknown Product',
            price: item.salePrice || item.price || 0,
            retailer: 'Walmart',
            category: (item.categoryPath || item.category || 'General').split('/')[0],
            image_url: item.mediumImage || item.thumbnailImage || item.imageUrl ||
                'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&h=150&fit=crop',
            in_stock: item.availableOnline !== false && item.stock !== 'Not available',
            rating: item.customerRating || item.rating || 4.0,
            reviews: item.numReviews || item.reviewCount || 0,
            productUrl: item.productUrl || item.productPageUrl,
        };
    },
};
