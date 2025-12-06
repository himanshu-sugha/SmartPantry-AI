// Retailer Product API Service (Mock + Flipkart integration)

export interface Product {
    id: string;
    name: string;
    price: number;
    retailer: 'Amazon' | 'Walmart' | 'Flipkart';
    category: string;
    image_url: string;
    in_stock: boolean;
    rating: number;
    reviews: number;
    productUrl?: string;
}

// Beautiful product images from Unsplash
const PRODUCT_IMAGES: Record<string, string> = {
    milk: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&h=150&fit=crop',
    eggs: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=150&h=150&fit=crop',
    bread: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=150&h=150&fit=crop',
    chicken: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=150&h=150&fit=crop',
    apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=150&h=150&fit=crop',
    default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&h=150&fit=crop',
};

// Mock product database
const MOCK_PRODUCTS: Record<string, Product[]> = {
    'milk': [
        {
            id: 'amz-milk-1',
            name: 'Organic Whole Milk, 1 Gallon',
            price: 5.99,
            retailer: 'Amazon',
            category: 'Dairy',
            image_url: PRODUCT_IMAGES.milk,
            in_stock: true,
            rating: 4.5,
            reviews: 1234,
        },
        {
            id: 'wmt-milk-1',
            name: 'Great Value Whole Milk, 1 Gallon',
            price: 4.49,
            retailer: 'Walmart',
            category: 'Dairy',
            image_url: PRODUCT_IMAGES.milk,
            in_stock: true,
            rating: 4.3,
            reviews: 892,
        },
    ],
    'eggs': [
        {
            id: 'amz-eggs-1',
            name: 'Organic Large Eggs, 12 Count',
            price: 6.99,
            retailer: 'Amazon',
            category: 'Dairy',
            image_url: PRODUCT_IMAGES.eggs,
            in_stock: true,
            rating: 4.7,
            reviews: 2341,
        },
        {
            id: 'wmt-eggs-1',
            name: 'Great Value Large Eggs, 12 Count',
            price: 4.99,
            retailer: 'Walmart',
            category: 'Dairy',
            image_url: PRODUCT_IMAGES.eggs,
            in_stock: true,
            rating: 4.4,
            reviews: 1567,
        },
    ],
    'bread': [
        {
            id: 'amz-bread-1',
            name: 'Whole Wheat Bread, 20 oz',
            price: 3.99,
            retailer: 'Amazon',
            category: 'Pantry',
            image_url: PRODUCT_IMAGES.bread,
            in_stock: true,
            rating: 4.2,
            reviews: 567,
        },
        {
            id: 'wmt-bread-1',
            name: 'Great Value Wheat Bread, 20 oz',
            price: 2.99,
            retailer: 'Walmart',
            category: 'Pantry',
            image_url: PRODUCT_IMAGES.bread,
            in_stock: true,
            rating: 4.0,
            reviews: 432,
        },
    ],
    'chicken': [
        {
            id: 'amz-chicken-1',
            name: 'Organic Chicken Breast, 1 lb',
            price: 8.99,
            retailer: 'Amazon',
            category: 'Meat',
            image_url: PRODUCT_IMAGES.chicken,
            in_stock: true,
            rating: 4.6,
            reviews: 890,
        },
        {
            id: 'wmt-chicken-1',
            name: 'Fresh Chicken Breast, 1 lb',
            price: 6.99,
            retailer: 'Walmart',
            category: 'Meat',
            image_url: PRODUCT_IMAGES.chicken,
            in_stock: true,
            rating: 4.3,
            reviews: 654,
        },
    ],
    'apple': [
        {
            id: 'amz-apple-1',
            name: 'Organic Gala Apples, 3 lb Bag',
            price: 7.99,
            retailer: 'Amazon',
            category: 'Produce',
            image_url: PRODUCT_IMAGES.apple,
            in_stock: true,
            rating: 4.5,
            reviews: 1123,
        },
        {
            id: 'wmt-apple-1',
            name: 'Fresh Gala Apples, 3 lb Bag',
            price: 5.99,
            retailer: 'Walmart',
            category: 'Produce',
            image_url: PRODUCT_IMAGES.apple,
            in_stock: true,
            rating: 4.2,
            reviews: 876,
        },
    ],
};

export const RetailerAPIService = {
    // Search products by item name
    async searchProducts(itemName: string, retailer?: 'Amazon' | 'Walmart'): Promise<Product[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const searchTerm = itemName.toLowerCase();
        let results: Product[] = [];

        // Search in mock database
        for (const [key, products] of Object.entries(MOCK_PRODUCTS)) {
            if (searchTerm.includes(key) || key.includes(searchTerm)) {
                results = [...results, ...products];
            }
        }

        // Filter by retailer if specified
        if (retailer) {
            results = results.filter(p => p.retailer === retailer);
        }

        // If no exact match, return generic product
        if (results.length === 0) {
            results = [
                {
                    id: `amz-${searchTerm}-1`,
                    name: `${itemName} (Amazon)`,
                    price: Math.random() * 10 + 2.99,
                    retailer: 'Amazon',
                    category: 'Pantry',
                    image_url: PRODUCT_IMAGES.default,
                    in_stock: true,
                    rating: 4.0 + Math.random(),
                    reviews: Math.floor(Math.random() * 1000),
                },
                {
                    id: `wmt-${searchTerm}-1`,
                    name: `${itemName} (Walmart)`,
                    price: Math.random() * 8 + 1.99,
                    retailer: 'Walmart',
                    category: 'Pantry',
                    image_url: PRODUCT_IMAGES.default,
                    in_stock: true,
                    rating: 3.8 + Math.random(),
                    reviews: Math.floor(Math.random() * 800),
                },
            ];
        }

        return results;
    },

    // Get product by ID
    async getProduct(productId: string): Promise<Product | null> {
        await new Promise(resolve => setTimeout(resolve, 300));

        for (const products of Object.values(MOCK_PRODUCTS)) {
            const product = products.find(p => p.id === productId);
            if (product) return product;
        }

        return null;
    },

    // Get best price for item
    async getBestPrice(itemName: string): Promise<Product | null> {
        const products = await this.searchProducts(itemName);
        if (products.length === 0) return null;

        return products.reduce((best, current) =>
            current.price < best.price ? current : best
        );
    },

    // Check stock availability
    async checkStock(productId: string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 200));
        const product = await this.getProduct(productId);
        return product?.in_stock ?? false;
    },
};
