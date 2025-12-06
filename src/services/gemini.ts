// Gemini AI Service - Provides AI-powered intelligence for SmartPantry
// Uses Google's Gemini 2.5 Flash model for fast, intelligent responses

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface GeminiResponse {
    text: string;
    success: boolean;
    error?: string;
}

export const GeminiService = {
    // Get API key from environment
    getApiKey(): string {
        return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    },

    // Check if API is configured
    isConfigured(): boolean {
        const key = this.getApiKey();
        return key.length > 0 && key !== 'your-gemini-api-key';
    },

    // Generate content using Gemini
    async generate(prompt: string): Promise<GeminiResponse> {
        const apiKey = this.getApiKey();

        if (!apiKey) {
            return { text: '', success: false, error: 'Gemini API key not configured' };
        }

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 256 }
                }),
            });

            const data = await response.json();

            if (data.error) {
                return { text: '', success: false, error: data.error.message || 'Gemini API error' };
            }

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return { text, success: true };
        } catch (error) {
            return { text: '', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    },

    // === INVENTORY & AGENT FEATURES ===

    // Categorize an item automatically
    async categorizeItem(itemName: string): Promise<GeminiResponse> {
        const prompt = `Categorize this grocery item: "${itemName}"
Categories: Produce, Dairy, Meat, Pantry, Beverages, Household, Other
Respond with ONLY: {"category": "Dairy", "unit": "L"}`;
        return this.generate(prompt);
    },

    // Suggest reorder quantity
    async suggestReorderQuantity(itemName: string, currentQty: number, dailyUsage: number): Promise<GeminiResponse> {
        const prompt = `Item: ${itemName}, have ${currentQty}, use ${dailyUsage.toFixed(2)}/day.
Suggest reorder quantity considering package sizes and shelf life.
Respond ONLY: {"quantity": 5, "reason": "brief reason"}`;
        return this.generate(prompt);
    },

    // Agent thinking/reasoning for display
    async getAgentThought(context: string): Promise<GeminiResponse> {
        const prompt = `You are SmartPantry AI. Context: ${context}
Provide a brief, friendly thought in 1-2 sentences. Be helpful and slightly witty.`;
        return this.generate(prompt);
    },

    // === RECEIPT & CAMERA FEATURES ===

    // Parse receipt text using AI
    async parseReceiptText(ocrText: string): Promise<GeminiResponse> {
        const apiKey = this.getApiKey();
        if (!apiKey) return { text: '[]', success: false, error: 'API key not configured' };

        const prompt = `Extract grocery items from this receipt OCR text:
${ocrText.slice(0, 2000)}

Extract ONLY items with prices. Ignore store info, tax, totals, payment.
Respond ONLY with JSON array:
[{"name": "Whole Milk", "price": 3.99, "quantity": 1, "category": "Dairy"}]`;

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
                }),
            });
            const data = await response.json();
            if (data.error) return { text: '[]', success: false, error: data.error.message };
            return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || '[]', success: true };
        } catch {
            return { text: '[]', success: false, error: 'Parse failed' };
        }
    },

    // Identify product from camera/barcode text
    async identifyProduct(text: string): Promise<GeminiResponse> {
        const prompt = `Identify this product: "${text}"
Respond ONLY: {"name": "Name", "category": "Dairy", "unit": "L", "estimatedPrice": 0.00, "confidence": "high"}`;
        return this.generate(prompt);
    },

    // === SMART SEARCH & SHOPPING ===

    // Enhance search query for better product matching
    async enhanceSearchQuery(query: string): Promise<GeminiResponse> {
        const prompt = `User searching for: "${query}"
Enhance for better product matches. Respond ONLY:
{"enhanced": "optimized query", "alternatives": ["alt1", "alt2"], "category": "suggested category"}`;
        return this.generate(prompt);
    },

    // Get shopping suggestions based on low stock items
    async getShoppingSuggestions(lowStockItems: string[]): Promise<GeminiResponse> {
        const prompt = `These items are running low: ${lowStockItems.join(', ')}
Suggest 2-3 items that go well with these. Respond ONLY: ["item1", "item2", "item3"]`;
        return this.generate(prompt);
    },

    // Explain if product is good value
    async explainPriceValue(productName: string, price: number, quantity: string): Promise<GeminiResponse> {
        const prompt = `Product: ${productName}, Price: $${price.toFixed(2)}, Size: ${quantity}
Is this good value? Respond in 1 sentence starting with "✅ Good value" or "⚠️ Consider" or "💡 Tip".`;
        return this.generate(prompt);
    },

    // === MEAL & COMMAND FEATURES ===

    // Get meal suggestions based on inventory
    async getMealSuggestions(inventoryItems: string[]): Promise<GeminiResponse> {
        const prompt = `Available: ${inventoryItems.join(', ')}
Suggest 2-3 simple meals. Respond ONLY:
[{"name": "Meal", "ingredients": ["item1"], "difficulty": "easy"}]`;
        return this.generate(prompt);
    },

    // Parse natural language command
    async parseNaturalCommand(command: string): Promise<GeminiResponse> {
        const prompt = `Parse this command: "${command}"
Intents: add_item, use_item, search, check_stock, suggest_meal
Respond ONLY: {"intent": "add_item", "items": [{"name": "milk", "quantity": 1}], "confidence": 0.9}`;
        return this.generate(prompt);
    },

    // === AI SANDBOX / VENDOR FEATURES ===

    // Generate realistic products for a search query (AI-powered sandbox)
    async generateProducts(query: string, count: number = 5): Promise<GeminiResponse> {
        const apiKey = this.getApiKey();
        if (!apiKey) return { text: '[]', success: false, error: 'API key not configured' };

        const prompt = `You are a grocery product database. Generate ${count} realistic US grocery products for: "${query}"

For each product include realistic:
- US brand names (Horizon, Organic Valley, Kraft, General Mills, Kellogg's, Tyson, etc.)
- Realistic price in US Dollars ($)
- Discount % (0-30%)
- Rating (3.5-5.0)
- Stock availability

Respond ONLY with JSON array (no explanation):
[
  {
    "id": "prod_1",
    "name": "Horizon Organic Whole Milk 64oz",
    "brand": "Horizon",
    "price": 5.99,
    "mrp": 6.49,
    "discount": 8,
    "category": "Dairy",
    "rating": 4.5,
    "reviews": 2847,
    "inStock": true,
    "stock": 50,
    "image": "https://via.placeholder.com/150?text=Milk"
  }
]`;

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.8, maxOutputTokens: 2048 }
                }),
            });
            const data = await response.json();
            if (data.error) return { text: '[]', success: false, error: data.error.message };
            return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || '[]', success: true };
        } catch {
            return { text: '[]', success: false, error: 'Generation failed' };
        }
    },

    // Get product recommendations (cross-selling)
    async getProductRecommendations(cartItems: string[], inventoryItems: string[]): Promise<GeminiResponse> {
        const prompt = `User is buying: ${cartItems.join(', ')}
Already has: ${inventoryItems.join(', ')}

Suggest 3 complementary Indian grocery products they might need.
Respond ONLY with JSON array:
[
  {"name": "Britannia Bread", "reason": "Goes well with milk", "price": 45, "brand": "Britannia"}
]`;
        return this.generate(prompt);
    },

    // Find substitute products
    async findSubstitutes(productName: string, reason: string = "out of stock"): Promise<GeminiResponse> {
        const prompt = `"${productName}" is ${reason}. Suggest 3 Indian alternatives.
Respond ONLY with JSON array:
[
  {"name": "Mother Dairy Full Cream Milk 500ml", "brand": "Mother Dairy", "price": 28, "reason": "Similar quality, slightly cheaper"}
]`;
        return this.generate(prompt);
    },

    // Analyze if price is good value (US market)
    async analyzePriceValue(productName: string, price: number, quantity: string): Promise<GeminiResponse> {
        const prompt = `US market: ${productName}, $${price}, ${quantity}
Is this good value? Respond in 1 sentence: "✅ Good deal" or "⚠️ Slightly high" or "💡 Tip: ..."`;
        return this.generate(prompt);
    },

    // === EMAIL PARSING ===

    // Parse grocery order email to extract items
    async parseGroceryEmail(emailText: string): Promise<GeminiResponse> {
        const apiKey = this.getApiKey();
        if (!apiKey) return { text: '[]', success: false, error: 'API key not configured' };

        const prompt = `You are an email parser AI. Extract grocery items from this order confirmation email:

EMAIL CONTENT:
${emailText.slice(0, 3000)}

Extract ordered grocery items with:
- Item name
- Quantity ordered
- Price (if available)
- Category (Produce/Dairy/Meat/Pantry/Beverages/Household/Other)

Ignore:
- Shipping info, addresses
- Order numbers, tracking
- Payment details
- Promotional content

Respond ONLY with JSON array:
[
  {"name": "Amul Milk 500ml", "quantity": 2, "price": 30, "category": "Dairy"},
  {"name": "Bread", "quantity": 1, "price": 45, "category": "Pantry"}
]

If no groceries found, return: []`;

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
                }),
            });
            const data = await response.json();
            if (data.error) return { text: '[]', success: false, error: data.error.message };
            return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || '[]', success: true };
        } catch {
            return { text: '[]', success: false, error: 'Parse failed' };
        }
    },
};


