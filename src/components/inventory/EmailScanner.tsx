'use client'

import { useState } from 'react';
import { Mail, Sparkles, Loader2, Check, Package, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeminiService } from '@/services/gemini';

interface ParsedEmailItem {
    name: string;
    quantity: number;
    price?: number;
    category: string;
}

interface EmailScannerProps {
    onItemsParsed: (items: ParsedEmailItem[]) => void;
}

// Sample grocery order emails for demo
const SAMPLE_EMAILS = [
    {
        subject: "🛒 Your Walmart Grocery Order is Confirmed!",
        body: `Hi Customer,

Thank you for shopping with Walmart! Your order has been confirmed.

📦 Order #WM2024120789

Your Items:
• Horizon Organic Milk 64oz × 3 — $17.97
• Chobani Greek Yogurt 32oz × 4 — $21.96
• Nature's Own Honey Wheat Bread × 2 — $7.98
• Organic Valley Eggs (12 pcs) × 2 — $13.98
• Morton Salt 26oz × 1 — $1.49
• Wesson Vegetable Oil 48oz × 1 — $4.99

Total: $68.37 | Delivery: FREE
Expected Delivery: Tomorrow, 10 AM - 12 PM

Happy Shopping! 🥬
Team Walmart`,
        items: [
            { name: "Horizon Organic Milk 64oz", quantity: 3, price: 5.99, category: "Dairy" },
            { name: "Chobani Greek Yogurt 32oz", quantity: 4, price: 5.49, category: "Dairy" },
            { name: "Nature's Own Bread", quantity: 2, price: 3.99, category: "Pantry" },
            { name: "Organic Valley Eggs 12pcs", quantity: 2, price: 6.99, category: "Dairy" },
            { name: "Morton Salt 26oz", quantity: 1, price: 1.49, category: "Pantry" },
            { name: "Wesson Vegetable Oil 48oz", quantity: 1, price: 4.99, category: "Pantry" },
        ]
    },
    {
        subject: "📦 Amazon Fresh: Your Order Has Shipped!",
        body: `Hello,

Great news! Your Amazon Fresh order is on its way.

Order Details:
─────────────────
• Fairlife Milk 52oz (Pack of 2) × 2 — $19.96
• Oreo Cookies 20oz × 2 — $9.98
• Kraft Mac & Cheese (12 pack) × 2 — $25.98
• Tide Pods 42ct — $19.99
• Dawn Dish Soap 28oz × 2 — $7.98
• Dove Soap (8 pack) — $8.49
─────────────────
Order Total: $92.38

Track your order at amazon.com/orders

Thanks for choosing Amazon Fresh!`,
        items: [
            { name: "Fairlife Milk 52oz Pack of 2", quantity: 2, price: 9.98, category: "Dairy" },
            { name: "Oreo Cookies 20oz", quantity: 2, price: 4.99, category: "Pantry" },
            { name: "Kraft Mac & Cheese 12 pack", quantity: 2, price: 12.99, category: "Pantry" },
            { name: "Tide Pods 42ct", quantity: 1, price: 19.99, category: "Household" },
            { name: "Dawn Dish Soap 28oz", quantity: 2, price: 3.99, category: "Household" },
            { name: "Dove Soap 8 pack", quantity: 1, price: 8.49, category: "Household" },
        ]
    },
    {
        subject: "⚡ Instacart: Arriving Soon!",
        body: `Hey there! 👋

Your Instacart order is packed and your shopper is on the way!

🛒 Your Items:
• Land O Lakes Butter 16oz × 2 — $9.98
• Cheetos Crunchy 8.5oz × 4 — $13.96
• Pepsi 2L × 6 — $17.94
• Lay's Classic 10oz × 3 — $11.97
• Hershey's Milk Chocolate Bar × 5 — $9.95
• Tropicana Orange Juice 52oz × 2 — $8.98

Total: $72.78

Your shopper is 10 mins away! 🚗

— Team Instacart`,
        items: [
            { name: "Land O Lakes Butter 16oz", quantity: 2, price: 4.99, category: "Dairy" },
            { name: "Cheetos Crunchy 8.5oz", quantity: 4, price: 3.49, category: "Pantry" },
            { name: "Pepsi 2L", quantity: 6, price: 2.99, category: "Beverages" },
            { name: "Lays Classic 10oz", quantity: 3, price: 3.99, category: "Pantry" },
            { name: "Hershey's Chocolate Bar", quantity: 5, price: 1.99, category: "Pantry" },
            { name: "Tropicana Orange Juice 52oz", quantity: 2, price: 4.49, category: "Beverages" },
        ]
    }
];

export function EmailScanner({ onItemsParsed }: EmailScannerProps) {
    const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
    const [customEmail, setCustomEmail] = useState('');
    const [parsing, setParsing] = useState(false);
    const [parsedItems, setParsedItems] = useState<ParsedEmailItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [usedAI, setUsedAI] = useState(false);

    const parseEmailWithAI = async (emailText: string): Promise<ParsedEmailItem[] | null> => {
        try {
            const response = await GeminiService.parseGroceryEmail(emailText);
            if (response.success && response.text) {
                let jsonText = response.text.trim();
                if (jsonText.startsWith('```')) {
                    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
                }
                const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const items = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(items) && items.length > 0) {
                        return items;
                    }
                }
            }
        } catch (e) {
            console.log('AI parsing failed:', e);
        }
        return null;
    };

    const handleSampleEmail = async (index: number) => {
        setSelectedEmail(index);
        const email = SAMPLE_EMAILS[index];
        setCustomEmail(email.body); // Show email body in textarea
        setParsing(true);
        setError(null);
        setParsedItems([]);
        setUsedAI(false);

        // Try AI first
        if (GeminiService.isConfigured()) {
            console.log('📧 Trying AI parsing...');
            const aiItems = await parseEmailWithAI(email.body);
            if (aiItems) {
                console.log('✅ AI parsed', aiItems.length, 'items');
                setParsedItems(aiItems);
                onItemsParsed(aiItems);
                setUsedAI(true);
                setParsing(false);
                return;
            }
        }

        // Fallback to pre-parsed items
        console.log('📦 Using pre-parsed items (fallback)');
        setParsedItems(email.items);
        onItemsParsed(email.items);
        setParsing(false);
    };

    const handleCustomEmail = async () => {
        if (!customEmail.trim()) return;

        setSelectedEmail(null);
        setParsing(true);
        setError(null);
        setParsedItems([]);
        setUsedAI(false);

        const aiItems = await parseEmailWithAI(customEmail);
        if (aiItems) {
            setParsedItems(aiItems);
            onItemsParsed(aiItems);
            setUsedAI(true);
        } else {
            setError('Could not parse email - try a sample email');
        }
        setParsing(false);
    };

    return (
        <div className="space-y-4">
            {/* Sample Emails */}
            <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4" /> Sample Order Emails
                </label>
                <div className="grid grid-cols-1 gap-2">
                    {SAMPLE_EMAILS.map((email, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSampleEmail(idx)}
                            disabled={parsing}
                            className={`text-left p-3 rounded-lg border transition-all ${selectedEmail === idx
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                                } ${parsing ? 'opacity-50' : ''}`}
                        >
                            <div className="font-medium text-sm">{email.subject}</div>
                            <div className="text-xs text-gray-500">{email.items.length} items</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Email */}
            <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Or paste your own:
                </label>
                <textarea
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="Paste grocery order email here..."
                    className="w-full h-24 p-3 border rounded-lg text-sm resize-none"
                />
                <Button
                    onClick={handleCustomEmail}
                    disabled={!customEmail.trim() || parsing}
                    className="mt-2 gap-2"
                    size="sm"
                >
                    <Sparkles className="h-4 w-4" /> Parse with AI
                </Button>
            </div>

            {/* Status */}
            {parsing && (
                <div className="flex items-center gap-2 text-purple-600 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Parsing email...
                </div>
            )}

            {error && (
                <div className="text-red-600 text-sm flex items-center gap-2">
                    <X className="h-4 w-4" /> {error}
                </div>
            )}

            {/* Parsed Items */}
            {parsedItems.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="text-sm font-medium text-green-800 flex items-center gap-2 mb-2">
                        <Check className="h-4 w-4" /> Found {parsedItems.length} items
                        {usedAI && <span className="text-purple-600 text-xs">(AI)</span>}
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {parsedItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Package className="h-3 w-3 text-gray-400" />
                                    <span className="truncate max-w-[150px]">{item.name}</span>
                                    <span className="text-gray-400">x{item.quantity}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.price && <span className="text-green-600">${item.price}</span>}
                                    <span className="text-xs bg-gray-100 px-1 rounded">
                                        {item.category}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
