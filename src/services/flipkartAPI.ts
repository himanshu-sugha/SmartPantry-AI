// Flipkart Affiliate API Service for India
// Register at: https://affiliate.flipkart.com

export interface FlipkartProduct {
    productId: string;
    title: string;
    productUrl: string;
    imageUrls: {
        url: string;
        resolutionType: string;
    }[];
    productBrand?: string;
    productBaseInfoV1?: {
        title: string;
        productDescription?: string;
        categoryPath?: string;
        maximumRetailPrice?: { amount: number; currency: string };
        flipkartSellingPrice?: { amount: number; currency: string };
        flipkartSpecialPrice?: { amount: number; currency: string };
        productUrl: string;
        inStock: boolean;
        attributes: Record<string, string>;
    };
}

export interface FlipkartSearchResponse {
    products: FlipkartProduct[];
    validTill?: number;
    nextUrl?: string;
}

const FLIPKART_API_BASE = 'https://affiliate-api.flipkart.net/affiliate';

export const FlipkartAPIService = {
    // Check if configured
    isConfigured(): boolean {
        return !!(
            process.env.FLIPKART_AFFILIATE_ID &&
            process.env.FLIPKART_AFFILIATE_TOKEN
        );
    },

    // Get auth headers
    getHeaders(): Record<string, string> {
        return {
            'Fk-Affiliate-Id': process.env.FLIPKART_AFFILIATE_ID || '',
            'Fk-Affiliate-Token': process.env.FLIPKART_AFFILIATE_TOKEN || '',
            'Accept': 'application/json',
        };
    },

    // Search products by keyword
    async search(query: string): Promise<FlipkartProduct[]> {
        if (!this.isConfigured()) {
            console.warn('Flipkart API not configured');
            return [];
        }

        try {
            // Flipkart uses product feeds, so we search through keyword API
            const url = `${FLIPKART_API_BASE}/1.0/search.json?query=${encodeURIComponent(query)}&resultCount=20`;

            const response = await fetch(url, {
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                console.error('Flipkart API error:', response.status);
                return [];
            }

            const data = await response.json();
            return data.products || [];
        } catch (error) {
            console.error('Flipkart API error:', error);
            return [];
        }
    },

    // Get product by ID
    async getProduct(productId: string): Promise<FlipkartProduct | null> {
        if (!this.isConfigured()) return null;

        try {
            const url = `${FLIPKART_API_BASE}/1.0/product.json?id=${productId}`;

            const response = await fetch(url, {
                headers: this.getHeaders(),
            });

            if (!response.ok) return null;

            return await response.json();
        } catch (error) {
            console.error('Flipkart lookup error:', error);
            return null;
        }
    },

    // Get all categories
    async getCategories(): Promise<any[]> {
        if (!this.isConfigured()) return [];

        try {
            const url = `${FLIPKART_API_BASE}/api/pinky_chinky.json`;

            const response = await fetch(url, {
                headers: this.getHeaders(),
            });

            if (!response.ok) return [];

            const data = await response.json();
            return data.apiGroups?.affiliate?.apiListings || [];
        } catch (error) {
            console.error('Flipkart categories error:', error);
            return [];
        }
    },

    // Convert to our Product format
    toProduct(fp: FlipkartProduct): {
        id: string;
        name: string;
        price: number;
        retailer: 'Flipkart';
        category: string;
        image_url: string;
        in_stock: boolean;
        rating: number;
        reviews: number;
        productUrl: string;
    } {
        const baseInfo = fp.productBaseInfoV1;
        const price = baseInfo?.flipkartSpecialPrice?.amount ||
            baseInfo?.flipkartSellingPrice?.amount ||
            baseInfo?.maximumRetailPrice?.amount || 0;

        return {
            id: `flipkart-${fp.productId}`,
            name: baseInfo?.title || fp.title || 'Unknown Product',
            price: price,
            retailer: 'Flipkart',
            category: baseInfo?.categoryPath?.split('/')[0] || 'General',
            image_url: fp.imageUrls?.[0]?.url ||
                'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&h=150&fit=crop',
            in_stock: baseInfo?.inStock ?? true,
            rating: 4.0, // Flipkart API doesn't include rating directly
            reviews: 0,
            productUrl: baseInfo?.productUrl || fp.productUrl,
        };
    },
};
