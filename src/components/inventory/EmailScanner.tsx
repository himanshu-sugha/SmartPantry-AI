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
        subject: "🛒 Your BigBasket Order is Confirmed!",
        body: `Hi Customer,

Thank you for shopping with BigBasket! Your order has been confirmed.

📦 Order #BB2024120789

Your Items:
• Amul Gold Milk 500ml × 2 — ₹64
• Mother Dairy Curd 400g × 1 — ₹35  
• Britannia Bread 400g × 1 — ₹45
• Farm Fresh Eggs (12 pcs) × 1 — ₹85
• Tata Salt 1kg × 1 — ₹28
• Fortune Sunflower Oil 1L × 1 — ₹145

Total: ₹402 | Delivery: FREE
Expected Delivery: Tomorrow, 10 AM - 12 PM

Happy Shopping! 🥬
Team BigBasket`,
        items: [
            { name: "Amul Gold Milk 500ml", quantity: 2, price: 64, category: "Dairy" },
            { name: "Mother Dairy Curd 400g", quantity: 1, price: 35, category: "Dairy" },
            { name: "Britannia Bread 400g", quantity: 1, price: 45, category: "Pantry" },
            { name: "Farm Fresh Eggs 12pcs", quantity: 1, price: 85, category: "Dairy" },
            { name: "Tata Salt 1kg", quantity: 1, price: 28, category: "Pantry" },
            { name: "Fortune Sunflower Oil 1L", quantity: 1, price: 145, category: "Pantry" },
        ]
    },
    {
        subject: "📦 Amazon Fresh: Your Order Has Shipped!",
        body: `Hello,

Great news! Your Amazon Fresh order is on its way.

Order Details:
─────────────────
• Nestle Milk 1L (Pack of 2) — ₹98
• Parle-G Biscuits 800g — ₹72
• Maggi 2-Minute Noodles (12 pack) — ₹156
• Surf Excel Matic 2kg — ₹425
• Vim Dishwash Bar 600g — ₹54
• Lifebuoy Soap (4 pack) — ₹145
─────────────────
Order Total: ₹950

Track your order at amazon.in/orders

Thanks for choosing Amazon Fresh!`,
        items: [
            { name: "Nestle Milk 1L Pack of 2", quantity: 1, price: 98, category: "Dairy" },
            { name: "Parle-G Biscuits 800g", quantity: 1, price: 72, category: "Pantry" },
            { name: "Maggi 2-Min Noodles 12 pack", quantity: 1, price: 156, category: "Pantry" },
            { name: "Surf Excel Matic 2kg", quantity: 1, price: 425, category: "Household" },
            { name: "Vim Dishwash Bar 600g", quantity: 1, price: 54, category: "Household" },
            { name: "Lifebuoy Soap 4 pack", quantity: 1, price: 145, category: "Household" },
        ]
    },
    {
        subject: "⚡ Zepto: Arriving in 10 minutes!",
        body: `Hey there! 👋

Your Zepto order is packed and your rider is on the way!

🛒 Your Items:
• Amul Butter 500g — ₹275
• Haldiram's Bhujia 400g — ₹120
• Pepsi 2L — ₹85
• Lay's Classic 115g × 2 — ₹80
• Cadbury Dairy Milk Silk — ₹95
• Real Mixed Fruit Juice 1L — ₹110

Total: ₹765

Your rider is 10 mins away! 🏍️

— Team Zepto`,
        items: [
            { name: "Amul Butter 500g", quantity: 1, price: 275, category: "Dairy" },
            { name: "Haldiram Bhujia 400g", quantity: 1, price: 120, category: "Pantry" },
            { name: "Pepsi 2L", quantity: 1, price: 85, category: "Beverages" },
            { name: "Lays Classic 115g", quantity: 2, price: 80, category: "Pantry" },
            { name: "Cadbury Dairy Milk Silk", quantity: 1, price: 95, category: "Pantry" },
            { name: "Real Mixed Fruit Juice 1L", quantity: 1, price: 110, category: "Beverages" },
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
                                    {item.price && <span className="text-green-600">₹{item.price}</span>}
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
