// Client-side Flipkart API service
// Calls the server-side API route to fetch real Flipkart products

export interface FlipkartProductClient {
    id: string;
    name: string;
    price: number;
    retailer: 'Flipkart';
    category: string;
    image_url: string;
    in_stock: boolean;
    rating: number;
    reviews: number;
    productUrl?: string;
}

export const FlipkartClientService = {
    // Check if Flipkart API is configured
    async isConfigured(): Promise<boolean> {
        try {
            const response = await fetch('/api/flipkart?action=categories');
            const data = await response.json();
            return !data.error || data.configured !== false;
        } catch {
            return false;
        }
    },

    // Search Flipkart products
    async searchProducts(query: string): Promise<FlipkartProductClient[]> {
        try {
            const response = await fetch(
                `/api/flipkart?action=search&query=${encodeURIComponent(query)}`
            );

            if (!response.ok) {
                console.warn('Flipkart API not available, using mock data');
                return [];
            }

            const data = await response.json();

            if (data.error) {
                console.warn('Flipkart API error:', data.error);
                return [];
            }

            // Convert Flipkart API response to our format
            const products = data.products || [];
            return products.map((item: any) => this.convertProduct(item));
        } catch (error) {
            console.error('Failed to fetch from Flipkart:', error);
            return [];
        }
    },

    // Lookup product by ID
    async lookupProduct(productId: string): Promise<FlipkartProductClient | null> {
        try {
            const response = await fetch(
                `/api/flipkart?action=product&productId=${productId}`
            );

            if (!response.ok) return null;

            const data = await response.json();
            if (data.error) return null;

            return this.convertProduct(data);
        } catch (error) {
            console.error('Failed to lookup Flipkart product:', error);
            return null;
        }
    },

    // Convert Flipkart API response to our product format
    convertProduct(item: any): FlipkartProductClient {
        const baseInfo = item.productBaseInfoV1 || item;
        const price = baseInfo.flipkartSpecialPrice?.amount ||
            baseInfo.flipkartSellingPrice?.amount ||
            baseInfo.maximumRetailPrice?.amount ||
            item.price || 0;

        return {
            id: `flipkart-${item.productId || Date.now()}`,
            name: baseInfo.title || item.title || item.productName || 'Unknown Product',
            price: price,
            retailer: 'Flipkart',
            category: (baseInfo.categoryPath || item.category || 'General').split('/')[0],
            image_url: item.imageUrls?.[0]?.url || baseInfo.imageUrl ||
                'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&h=150&fit=crop',
            in_stock: baseInfo.inStock !== false,
            rating: item.rating || 4.0,
            reviews: item.reviewCount || 0,
            productUrl: baseInfo.productUrl || item.productUrl,
        };
    },
};
