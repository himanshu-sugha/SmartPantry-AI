// Walmart Affiliate API Service
// Documentation: https://walmart.io

import crypto from 'crypto';

const WALMART_API_BASE = 'https://developer.api.walmart.com/api-proxy/service/affil/product/v2';

export interface WalmartProduct {
    itemId: string;
    name: string;
    salePrice: number;
    msrp?: number;
    upc?: string;
    categoryPath: string;
    shortDescription?: string;
    longDescription?: string;
    thumbnailImage?: string;
    mediumImage?: string;
    largeImage?: string;
    productUrl: string;
    customerRating?: number;
    numReviews?: number;
    stock?: string;
    availableOnline: boolean;
    brandName?: string;
}

export interface WalmartSearchResponse {
    query: string;
    totalResults: number;
    start: number;
    numItems: number;
    items: WalmartProduct[];
}

// Generate authentication signature for Walmart API
function generateSignature(
    consumerId: string,
    privateKey: string,
    timestamp: string
): string {
    const data = `${consumerId}\n${timestamp}\nWM_SEC.KEY_VERSION:1\n`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'base64');
}

// Get auth headers for Walmart API
function getAuthHeaders(consumerId: string, privateKey: string): Record<string, string> {
    const timestamp = Date.now().toString();
    const signature = generateSignature(consumerId, privateKey, timestamp);

    return {
        'WM_CONSUMER.ID': consumerId,
        'WM_CONSUMER.INTIMESTAMP': timestamp,
        'WM_SEC.KEY_VERSION': '1',
        'WM_SEC.AUTH_SIGNATURE': signature,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
}

export const WalmartAPIService = {
    // Check if credentials are configured
    isConfigured(): boolean {
        return !!(
            process.env.WALMART_CONSUMER_ID &&
            process.env.WALMART_PRIVATE_KEY
        );
    },

    // Search products
    async search(
        query: string,
        options?: {
            categoryId?: string;
            start?: number;
            numItems?: number;
            sort?: 'relevance' | 'price' | 'title' | 'bestseller' | 'customerRating';
            order?: 'asc' | 'desc';
        }
    ): Promise<WalmartSearchResponse | null> {
        if (!this.isConfigured()) {
            console.warn('Walmart API not configured');
            return null;
        }

        const consumerId = process.env.WALMART_CONSUMER_ID!;
        const privateKey = process.env.WALMART_PRIVATE_KEY!;

        const params = new URLSearchParams({
            query,
            format: 'json',
            numItems: String(options?.numItems || 10),
            start: String(options?.start || 1),
        });

        if (options?.categoryId) params.append('categoryId', options.categoryId);
        if (options?.sort) params.append('sort', options.sort);
        if (options?.order) params.append('order', options.order);

        try {
            const response = await fetch(
                `${WALMART_API_BASE}/search?${params.toString()}`,
                {
                    method: 'GET',
                    headers: getAuthHeaders(consumerId, privateKey),
                }
            );

            if (!response.ok) {
                console.error('Walmart API error:', response.status, await response.text());
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Walmart API request failed:', error);
            return null;
        }
    },

    // Lookup product by ID
    async lookupByIds(itemIds: string[]): Promise<WalmartProduct[] | null> {
        if (!this.isConfigured()) return null;

        const consumerId = process.env.WALMART_CONSUMER_ID!;
        const privateKey = process.env.WALMART_PRIVATE_KEY!;

        try {
            const response = await fetch(
                `${WALMART_API_BASE}/items?ids=${itemIds.join(',')}&format=json`,
                {
                    method: 'GET',
                    headers: getAuthHeaders(consumerId, privateKey),
                }
            );

            if (!response.ok) return null;
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Walmart lookup failed:', error);
            return null;
        }
    },

    // Lookup by UPC/GTIN
    async lookupByUPC(upc: string): Promise<WalmartProduct | null> {
        if (!this.isConfigured()) return null;

        const consumerId = process.env.WALMART_CONSUMER_ID!;
        const privateKey = process.env.WALMART_PRIVATE_KEY!;

        try {
            const response = await fetch(
                `${WALMART_API_BASE}/items?upc=${upc}&format=json`,
                {
                    method: 'GET',
                    headers: getAuthHeaders(consumerId, privateKey),
                }
            );

            if (!response.ok) return null;
            const data = await response.json();
            return data.items?.[0] || null;
        } catch (error) {
            console.error('Walmart UPC lookup failed:', error);
            return null;
        }
    },

    // Convert Walmart product to our Product format
    toProduct(wp: WalmartProduct): {
        id: string;
        name: string;
        price: number;
        retailer: 'Walmart';
        category: string;
        image_url: string;
        in_stock: boolean;
        rating: number;
        reviews: number;
        productUrl: string;
    } {
        return {
            id: `walmart-${wp.itemId}`,
            name: wp.name,
            price: wp.salePrice,
            retailer: 'Walmart',
            category: wp.categoryPath?.split('/')[0] || 'General',
            image_url: wp.mediumImage || wp.thumbnailImage || '',
            in_stock: wp.availableOnline && wp.stock !== 'Not available',
            rating: wp.customerRating || 0,
            reviews: wp.numReviews || 0,
            productUrl: wp.productUrl,
        };
    },
};
