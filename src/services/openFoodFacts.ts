// Open Food Facts API - Free, no registration needed
// Works globally for barcode scanning
// https://world.openfoodfacts.org/data

export interface OpenFoodProduct {
    code: string; // Barcode
    product_name: string;
    brands?: string;
    categories?: string;
    image_url?: string;
    image_small_url?: string;
    quantity?: string;
    nutriscore_grade?: string;
    ecoscore_grade?: string;
    ingredients_text?: string;
    allergens?: string;
    stores?: string;
    countries?: string;
}

export interface OpenFoodResponse {
    status: number; // 1 = found, 0 = not found
    status_verbose: string;
    product?: OpenFoodProduct;
}

const API_BASE = 'https://world.openfoodfacts.org/api/v2';

export const OpenFoodFactsService = {
    // Lookup product by barcode (UPC, EAN, etc.)
    async lookupBarcode(barcode: string): Promise<OpenFoodProduct | null> {
        try {
            const response = await fetch(
                `${API_BASE}/product/${barcode}.json`,
                {
                    headers: {
                        'User-Agent': 'SmartPantryAI/1.0 (https://github.com/smartpantry)',
                    },
                }
            );

            if (!response.ok) {
                console.error('Open Food Facts error:', response.status);
                return null;
            }

            const data: OpenFoodResponse = await response.json();

            if (data.status !== 1 || !data.product) {
                console.log('Product not found in Open Food Facts');
                return null;
            }

            return data.product;
        } catch (error) {
            console.error('Open Food Facts lookup failed:', error);
            return null;
        }
    },

    // Search products by name
    async search(query: string, page: number = 1): Promise<OpenFoodProduct[]> {
        try {
            const response = await fetch(
                `${API_BASE}/search?search_terms=${encodeURIComponent(query)}&page=${page}&page_size=20&json=true`,
                {
                    headers: {
                        'User-Agent': 'SmartPantryAI/1.0',
                    },
                }
            );

            if (!response.ok) return [];

            const data = await response.json();
            return data.products || [];
        } catch (error) {
            console.error('Open Food Facts search failed:', error);
            return [];
        }
    },

    // Convert to our InventoryItem format for adding
    toInventoryItem(product: OpenFoodProduct): {
        name: string;
        category: string;
        quantity: number;
        unit: string;
        brand?: string;
        barcode?: string;
    } {
        // Extract category from categories string
        const categoryParts = product.categories?.split(',') || [];
        const category = categoryParts[0]?.trim() || 'Pantry';

        // Map common categories
        const categoryMap: Record<string, string> = {
            'dairy': 'Dairy',
            'milk': 'Dairy',
            'cheese': 'Dairy',
            'yogurt': 'Dairy',
            'bread': 'Bakery',
            'bakery': 'Bakery',
            'fruit': 'Produce',
            'vegetable': 'Produce',
            'meat': 'Meat',
            'chicken': 'Meat',
            'beef': 'Meat',
            'fish': 'Seafood',
            'seafood': 'Seafood',
            'beverage': 'Beverages',
            'drink': 'Beverages',
            'snack': 'Snacks',
            'cereal': 'Breakfast',
            'frozen': 'Frozen',
        };

        let mappedCategory = 'Pantry';
        for (const [key, value] of Object.entries(categoryMap)) {
            if (category.toLowerCase().includes(key)) {
                mappedCategory = value;
                break;
            }
        }

        return {
            name: product.product_name || 'Unknown Product',
            category: mappedCategory,
            quantity: 1,
            unit: product.quantity || 'item',
            brand: product.brands,
            barcode: product.code,
        };
    },

    // Get nutrition grade badge color
    getNutriScoreColor(grade?: string): string {
        const colors: Record<string, string> = {
            'a': '#038141',
            'b': '#85BB2F',
            'c': '#FECB02',
            'd': '#EE8100',
            'e': '#E63E11',
        };
        return colors[grade?.toLowerCase() || ''] || '#999';
    },
};
