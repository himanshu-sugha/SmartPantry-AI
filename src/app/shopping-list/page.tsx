'use client'

import { useEffect, useState } from 'react';
import { InventoryService } from '@/services/inventory';
import { SuggestionsService, SmartSuggestion } from '@/services/suggestions';
import { VendorAPIService, VendorProduct } from '@/services/vendorAPI';
import { SpendControlsService } from '@/services/spendControls';
import { AuditLogService } from '@/services/auditLog';
import { BlockchainService } from '@/services/blockchain';
import { ApprovalModeService } from '@/services/approvalMode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShoppingCart, AlertTriangle, Clock, TrendingUp, Check, X, Store, Bot, Zap, User, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ShoppingListPage() {
    const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
    const [products, setProducts] = useState<Record<string, VendorProduct[]>>({});
    const [selectedProducts, setSelectedProducts] = useState<Record<string, VendorProduct>>({});
    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [aiProductsUsed, setAiProductsUsed] = useState(false);

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        try {
            const inventory = await InventoryService.getItems();
            const smartSuggestions = SuggestionsService.generateSuggestions(inventory);
            setSuggestions(smartSuggestions);

            // Load products for each suggestion
            if (smartSuggestions.length > 0) {
                loadProductsForSuggestions(smartSuggestions);
            }
        } catch (error) {
            console.error('Failed to load suggestions', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProductsForSuggestions = async (suggestions: SmartSuggestion[]) => {
        console.log('🛒 Loading products from Vendor API for suggestions:', suggestions.length);
        setLoadingProducts(true);
        setAiProductsUsed(false);
        const productsMap: Record<string, VendorProduct[]> = {};
        let usedAI = false;

        for (const suggestion of suggestions) {
            try {
                console.log(`🔍 Searching Vendor API for: ${suggestion.item.name}`);
                const { products: prods, aiGenerated } = await VendorAPIService.searchProducts(suggestion.item.name);

                if (aiGenerated) {
                    console.log(`🤖 AI generated ${prods.length} products for ${suggestion.item.name}`);
                    usedAI = true;
                } else {
                    console.log(`📦 Mock API returned ${prods.length} products for ${suggestion.item.name}`);
                }

                productsMap[suggestion.item.id] = prods;

                // Auto-select best price
                if (prods.length > 0) {
                    const bestPrice = prods.reduce((best: VendorProduct, current: VendorProduct) =>
                        current.price < best.price ? current : best
                    );
                    console.log(`💰 Auto-selected best price for ${suggestion.item.name}: ₹${bestPrice.price}`);
                    setSelectedProducts(prev => ({ ...prev, [suggestion.item.id]: bestPrice }));
                } else {
                    console.log(`⚠️ No products found for ${suggestion.item.name}`);
                }
            } catch (error) {
                console.error(`❌ Failed to load products for ${suggestion.item.name}`, error);
            }
        }

        setAiProductsUsed(usedAI);
        setProducts(productsMap);
        setLoadingProducts(false);
    };

    const handleCheckout = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const selectedItems = Object.values(selectedProducts);

        if (selectedItems.length === 0) {
            alert('No items selected for checkout');
            return;
        }

        const total = selectedItems.reduce((sum, p) => sum + p.price, 0);

        // Check approval mode
        const approvalCheck = ApprovalModeService.shouldAutoApprove(total);

        // Log the decision
        AuditLogService.logEvent('checkout_initiated', {
            mode: ApprovalModeService.getMode(),
            total,
            itemCount: selectedItems.length,
            autoApproved: approvalCheck.approved,
            reason: approvalCheck.reason,
        }, true);

        if (approvalCheck.approved) {
            // Auto mode or semi-auto under limit - proceed without dialog
            console.log(`🤖 ${approvalCheck.reason}`);

            // Still check spend caps
            const spendCheck = SpendControlsService.canPurchase(total);
            if (!spendCheck.allowed) {
                alert(`⚠️ ${spendCheck.reason || 'Spend cap exceeded'}`);
                return;
            }

            // Auto-complete the purchase
            await completePurchase(selectedItems, total);
            alert(`🤖 Order auto-approved!\n${approvalCheck.reason}\nTotal: ₹${total.toFixed(2)}`);
        } else {
            // Manual mode or semi-auto over limit - show confirmation dialog
            console.log(`👤 ${approvalCheck.reason}`);
            setCheckoutOpen(true);
        }
    };

    const handleConfirmPurchase = async () => {
        const selectedItems = Object.values(selectedProducts);
        const total = selectedItems.reduce((sum, p) => sum + p.price, 0);

        try {
            // Check spend caps
            const spendCheck = SpendControlsService.canPurchase(total);

            if (!spendCheck.allowed) {
                alert(spendCheck.reason || 'Purchase not allowed');
                setCheckoutOpen(false);
                return;
            }

            // If allowed, proceed
            completePurchase(selectedItems, total);
        } catch (error) {
            console.error('Error in checkout:', error);
            alert('An error occurred during checkout');
        }
    };

    const completePurchase = async (items: VendorProduct[], total: number) => {
        // Update spend tracking
        SpendControlsService.addSpend(total);

        // Calculate savings (mock - difference from highest priced alternative)
        const savings = items.reduce((sum, item) => {
            const higherPrice = item.price * 1.15; // Assume 15% savings vs competitors
            return sum + (higherPrice - item.price);
        }, 0);

        // Update inventory quantities
        for (const item of items) {
            // Find the inventory item ID that matches this product (conceptually)
            // In a real app, we'd have a direct link. Here we use the suggestion mapping.
            const suggestion = suggestions.find(s => products[s.item.id]?.some(p => p.id === item.id));
            if (suggestion) {
                await InventoryService.updateQuantity(suggestion.item.id, suggestion.recommendedQuantity);
            }
        }

        // Earn PantryPoints for purchase
        try {
            BlockchainService.recordAction('purchase_made', {
                itemCount: items.length,
                total,
                savings
            });
        } catch (e) {
            // Wallet may not be connected
        }

        // Log to audit
        AuditLogService.logEvent('purchase_approved', {
            items: items.map(p => ({ name: p.name, price: p.price, brand: p.brand })),
            total,
        }, true);

        // Remove purchased items from suggestions
        const purchasedIds = Object.keys(selectedProducts);
        setSuggestions(prev => prev.filter(s => !purchasedIds.includes(s.item.id)));

        // Clear agent pending state
        try {
            const { AutonomousAgentService } = await import('@/services/autonomousAgent');
            AutonomousAgentService.clearPending();
        } catch (e) { }

        setCheckoutOpen(false);
        setSelectedProducts({}); // Clear selected items
        alert(`Order placed successfully! Total: ₹${total.toFixed(2)}. Savings: ₹${savings.toFixed(2)}`);
    };

    const getUrgencyIcon = (urgency: string) => {
        switch (urgency) {
            case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
            case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
            default: return <TrendingUp className="h-4 w-4 text-blue-600" />;
        }
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'high': return 'border-l-red-500 bg-red-50';
            case 'medium': return 'border-l-yellow-500 bg-yellow-50';
            default: return 'border-l-blue-500 bg-blue-50';
        }
    };

    const selectedItems = Object.values(selectedProducts);
    const estimatedTotal = selectedItems.reduce((sum, p) => sum + p.price, 0);

    if (loading) {
        return <div className="flex items-center justify-center h-96">Loading suggestions...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="h-8 w-8" />
                        Smart Shopping List
                        {aiProductsUsed && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> AI Products
                            </Badge>
                        )}
                    </h1>
                    <p className="text-gray-500">
                        {aiProductsUsed
                            ? '🤖 Products generated by Gemini AI with realistic Indian brands & prices'
                            : 'AI-powered suggestions based on your consumption patterns'
                        }
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">${estimatedTotal.toFixed(2)}</div>
                    <Button
                        type="button"
                        onClick={handleCheckout}
                        disabled={selectedItems.length === 0}
                        className="mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Checkout ({selectedItems.length} items)
                    </Button>
                </div>
            </div>

            {suggestions.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Suggestions Yet</h3>
                        <p className="text-gray-500">Add items to your inventory and track consumption to get smart suggestions.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {suggestions.map((suggestion) => {
                        const itemProducts = products[suggestion.item.id] || [];
                        const selected = selectedProducts[suggestion.item.id];

                        return (
                            <Card key={suggestion.item.id} className={`border-l-4 ${getUrgencyColor(suggestion.urgency)}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getUrgencyIcon(suggestion.urgency)}
                                                <h3 className="font-semibold text-lg">{suggestion.item.name}</h3>
                                                <Badge variant="outline" className="text-xs">{suggestion.item.category}</Badge>
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <p className="text-gray-700">
                                                    <span className="font-medium">Recommended:</span> {suggestion.recommendedQuantity} {suggestion.item.unit}
                                                </p>
                                                <p className="text-gray-600">{suggestion.reason}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-emerald-600 h-2 rounded-full"
                                                            style={{ width: `${suggestion.confidence * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500">{(suggestion.confidence * 100).toFixed(0)}% confident</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Options */}
                                    {loadingProducts ? (
                                        <div className="text-sm text-gray-500">Loading products...</div>
                                    ) : itemProducts.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <p className="text-sm font-medium text-gray-700">Available Products:</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {itemProducts.map((product) => (
                                                    <div
                                                        key={product.id}
                                                        onClick={() => setSelectedProducts(prev => ({ ...prev, [suggestion.item.id]: product }))}
                                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${selected?.id === product.id
                                                            ? 'border-emerald-600 bg-emerald-50'
                                                            : 'border-gray-200 hover:border-emerald-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium">{product.name}</span>
                                                                    {selected?.id === product.id && (
                                                                        <Check className="h-4 w-4 text-emerald-600" />
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge variant="outline" className="text-xs">{product.brand}</Badge>
                                                                    <span className="text-xs text-gray-500">⭐ {product.rating.toFixed(1)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold text-emerald-600">₹{product.price.toFixed(2)}</div>
                                                                {product.inStock ? (
                                                                    <span className="text-xs text-green-600">In Stock</span>
                                                                ) : (
                                                                    <span className="text-xs text-red-600">Out of Stock</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Checkout Confirmation Dialog */}
            <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Purchase</DialogTitle>
                        <DialogDescription>Review your order before checkout</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {selectedItems.map((product) => (
                                <div key={product.id} className="flex justify-between text-sm">
                                    <span>{product.name} ({product.brand})</span>
                                    <span className="font-medium">₹{product.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-2">
                            <div className="flex justify-between font-bold">
                                <span>Total:</span>
                                <span>${estimatedTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleConfirmPurchase}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Approve Purchase
                            </Button>
                            <Button
                                onClick={() => setCheckoutOpen(false)}
                                variant="outline"
                                className="flex-1"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
