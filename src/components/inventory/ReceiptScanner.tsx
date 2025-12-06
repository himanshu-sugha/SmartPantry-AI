'use client'

import { useState } from 'react';
import { createWorker, PSM, OEM } from 'tesseract.js';
import { Upload, Loader2, Check, Package, AlertCircle, RefreshCw, Zap, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GeminiService } from '@/services/gemini';

interface ParsedItem {
    name: string;
    price: number;
    quantity: number;
    category?: string;
}

interface ReceiptScannerProps {
    onScanComplete: (text: string, items?: ParsedItem[]) => void;
}

// Walmart product abbreviation dictionary
const WALMART_ABBREVIATIONS: Record<string, { name: string; category: string }> = {
    'GV': { name: 'Great Value', category: 'Pantry' },
    'OATMEAL': { name: 'Oatmeal', category: 'Pantry' },
    'TUM': { name: 'Tums Antacid', category: 'Health' },
    'TUMS': { name: 'Tums Antacid', category: 'Health' },
    '200Z': { name: '20oz', category: '' },
    '20OZ': { name: '20oz', category: '' },
    'DEXAS': { name: 'Dexas Cutting Board', category: 'Household' },
    '15X20': { name: '15x20"', category: '' },
    'ATHLETICS': { name: 'Athletic Apparel', category: 'Other' },
    'MILK': { name: 'Milk', category: 'Dairy' },
    'EGGS': { name: 'Eggs', category: 'Dairy' },
    'BREAD': { name: 'Bread', category: 'Bakery' },
    'CHICKEN': { name: 'Chicken', category: 'Meat' },
    'BEEF': { name: 'Beef', category: 'Meat' },
    'APPLE': { name: 'Apples', category: 'Produce' },
    'BANANA': { name: 'Bananas', category: 'Produce' },
    'WATER': { name: 'Water', category: 'Beverages' },
    'SODA': { name: 'Soda', category: 'Beverages' },
    'COKE': { name: 'Coca-Cola', category: 'Beverages' },
    'PEPSI': { name: 'Pepsi', category: 'Beverages' },
};

// Clean and expand item name
function cleanItemName(rawName: string): { name: string; category: string } {
    let name = rawName.toUpperCase();
    let category = 'Other';
    const parts: string[] = [];

    // Split into words and process each
    const words = name.split(/\s+/);

    for (const word of words) {
        const abbrev = WALMART_ABBREVIATIONS[word];
        if (abbrev) {
            parts.push(abbrev.name);
            if (abbrev.category) category = abbrev.category;
        } else if (word.length > 1 && !/^\d+$/.test(word)) {
            // Keep the word but title case it
            parts.push(word.charAt(0) + word.slice(1).toLowerCase());
        }
    }

    const cleanedName = parts.join(' ').trim() || rawName;

    return { name: cleanedName, category };
}

// Parse receipt text to extract grocery items
function parseReceiptItems(text: string): ParsedItem[] {
    const items: ParsedItem[] = [];
    const lines = text.split('\n');

    // Pattern to match price at end of line
    const pricePattern = /(\d+\.\d{2})\s*[A-Z]?\s*$/;

    // Skip patterns
    const skipPatterns = [
        /^(ST#|OP#|TE#|TR#)/i,
        /^(SUBTOTAL|TOTAL|TAX|CHANGE)/i,
        /(DEBIT|CREDIT|CASH|TEND)/i,
        /^(EFT|REF|AID|AAC)/i,
        /^(NETWORK|TERMINAL)/i,
        /^\d{2}\/\d{2}\/\d{2}/,
        /^TC#|^#\s*ITEMS/i,
        /^(Give us|Thank|survey)/i,
        /walmart/i,
        /\*{3,}/,
        /^[0-9\s\-]+$/,
        /^[A-Z]{1,2}$/,
    ];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 5) continue;

        let shouldSkip = false;
        for (const pattern of skipPatterns) {
            if (pattern.test(trimmed)) {
                shouldSkip = true;
                break;
            }
        }
        if (shouldSkip) continue;

        const priceMatch = trimmed.match(pricePattern);
        if (priceMatch) {
            const price = parseFloat(priceMatch[1]);
            if (price > 0 && price < 500) {
                let rawName = trimmed.replace(pricePattern, '').trim();
                // Remove barcode numbers
                rawName = rawName.replace(/\d{8,}/g, '').trim();
                // Remove trailing single letters
                rawName = rawName.replace(/\s+[A-Z]\s*$/, '').trim();

                if (rawName.length >= 2) {
                    const { name, category } = cleanItemName(rawName);
                    items.push({
                        name,
                        price,
                        quantity: 1,
                        category,
                    });
                }
            }
        }
    }

    return items;
}

export function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<string>('');
    const [image, setImage] = useState<string | null>(null);
    const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
    const [rawText, setRawText] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImage(URL.createObjectURL(file));
        setScanning(true);
        setProgress(0);
        setStatus('Initializing OCR...');
        setParsedItems([]);
        setError(null);
        setRawText('');

        try {
            const worker = await createWorker('eng', OEM.LSTM_ONLY, {
                logger: (m) => {
                    if (m.status === 'loading tesseract core') {
                        setStatus('Loading OCR engine...');
                        setProgress(10);
                    } else if (m.status === 'loading language traineddata') {
                        setStatus('Loading language data (one-time 15MB download)...');
                        setProgress(10 + Math.round(m.progress * 40));
                    } else if (m.status === 'initializing api') {
                        setStatus('Starting OCR...');
                        setProgress(55);
                    } else if (m.status === 'recognizing text') {
                        setStatus('Reading receipt...');
                        setProgress(60 + Math.round(m.progress * 40));
                    }
                },
            });

            await worker.setParameters({
                tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
                preserve_interword_spaces: '1',
            });

            setStatus('Scanning...');
            const { data: { text, confidence } } = await worker.recognize(file);

            console.log('OCR Text:', text);
            console.log('Confidence:', confidence);
            setRawText(text);

            await worker.terminate();

            // Try AI parsing first (Gemini), fallback to regex
            let items: ParsedItem[] = [];
            let usedAI = false;

            if (GeminiService.isConfigured()) {
                setStatus('🤖 AI analyzing receipt...');
                setProgress(95);

                try {
                    const aiResponse = await GeminiService.parseReceiptText(text);
                    if (aiResponse.success && aiResponse.text) {
                        // Clean the response - remove markdown code blocks if present
                        let jsonText = aiResponse.text.trim();
                        if (jsonText.startsWith('```')) {
                            jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
                        }

                        const parsed = JSON.parse(jsonText);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            items = parsed;
                            usedAI = true;
                            console.log('✅ AI parsed items:', items);
                        }
                    }
                } catch (aiError) {
                    console.log('AI parsing failed, using regex fallback:', aiError);
                }
            }

            // Fallback to regex parsing if AI didn't work
            if (items.length === 0) {
                setStatus('Parsing with regex...');
                items = parseReceiptItems(text);
                console.log('Regex parsed items:', items);
            }

            setParsedItems(items);

            if (items.length === 0 && confidence < 50) {
                setError(`Low OCR confidence (${confidence.toFixed(0)}%). Try a clearer, cropped image.`);
            }

            onScanComplete(text, items);
            setStatus(usedAI ? '✨ AI Analysis Complete!' : 'Done!');
        } catch (err) {
            console.error('OCR Error:', err);
            setError(err instanceof Error ? err.message : 'OCR failed');
        } finally {
            setScanning(false);
        }
    };

    const handleRetry = () => {
        setImage(null);
        setParsedItems([]);
        setRawText('');
        setError(null);
        setStatus('');
        setProgress(0);
    };

    return (
        <div className="space-y-4">
            <div className="w-full">
                <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={scanning}
                    className="cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Free local OCR - works offline, no API needed
                </p>
            </div>

            {image && (
                <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden">
                    <img src={image} alt="Receipt preview" className="w-full h-full object-contain" />
                </div>
            )}

            {scanning && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{status}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center justify-between gap-2 text-amber-600 bg-amber-50 p-2 rounded">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRetry}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {!scanning && parsedItems.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <Check className="h-4 w-4" />
                        <span className="font-medium">Found {parsedItems.length} items!</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2 bg-gray-50">
                        {parsedItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm py-2 border-b last:border-0">
                                <div className="flex items-start gap-2">
                                    <Package className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="font-medium">{item.name}</div>
                                        {item.category && (
                                            <div className="text-xs text-gray-500">{item.category}</div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-emerald-600 font-medium">${item.price.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!scanning && rawText && (
                <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        Show raw OCR text
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                        {rawText}
                    </pre>
                </details>
            )}

            {image && !scanning && (
                <Button variant="outline" size="sm" onClick={handleRetry} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Scan another receipt
                </Button>
            )}
        </div>
    );
}
