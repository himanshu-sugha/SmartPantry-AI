'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Minus, Check } from 'lucide-react';

interface ConsumptionTrackerProps {
    itemId: string;
    itemName: string;
    currentQuantity: number;
    onConsume: (quantity: number) => void;
}

export function ConsumptionTracker({
    itemId,
    itemName,
    currentQuantity,
    onConsume
}: ConsumptionTrackerProps) {
    const [open, setOpen] = useState(false);
    const [customAmount, setCustomAmount] = useState(1);

    const handleQuickConsume = (amount: number) => {
        if (amount <= currentQuantity) {
            onConsume(amount);
        }
    };

    const handleCustomConsume = () => {
        if (customAmount > 0 && customAmount <= currentQuantity) {
            onConsume(customAmount);
            setOpen(false);
            setCustomAmount(1);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Minus className="h-3 w-3" />
                    Use
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Log Consumption</DialogTitle>
                    <DialogDescription>
                        Track how much of "{itemName}" you've used.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="text-sm text-gray-500">
                        Current quantity: <span className="font-semibold text-gray-900">{currentQuantity}</span>
                    </div>

                    <div className="space-y-2">
                        <Label>Quick Actions</Label>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    handleQuickConsume(1);
                                    setOpen(false);
                                }}
                                disabled={currentQuantity < 1}
                            >
                                Used 1
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    handleQuickConsume(currentQuantity);
                                    setOpen(false);
                                }}
                                disabled={currentQuantity === 0}
                            >
                                Used All
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="custom-amount">Custom Amount</Label>
                        <div className="flex gap-2">
                            <Input
                                id="custom-amount"
                                type="number"
                                min={1}
                                max={currentQuantity}
                                value={customAmount}
                                onChange={(e) => setCustomAmount(parseInt(e.target.value) || 1)}
                                className="flex-1"
                            />
                            <Button onClick={handleCustomConsume} disabled={customAmount > currentQuantity || customAmount <= 0}>
                                <Check className="h-4 w-4 mr-2" />
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
