'use client'

import { useState, useEffect } from 'react';
import { ApprovalModeService, ApprovalMode, ApprovalSettings } from '@/services/approvalMode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Zap, User, Shield, Check } from 'lucide-react';

const MODE_OPTIONS: { mode: ApprovalMode; icon: React.ReactNode; label: string; description: string }[] = [
    {
        mode: 'auto',
        icon: <Bot className="h-5 w-5" />,
        label: 'Fully Automatic',
        description: 'Agent places orders automatically without asking. Best for routine purchases.',
    },
    {
        mode: 'semi-auto',
        icon: <Zap className="h-5 w-5" />,
        label: 'Semi-Automatic',
        description: 'Auto-approve orders under a set limit. Ask for approval on larger orders.',
    },
    {
        mode: 'manual',
        icon: <User className="h-5 w-5" />,
        label: 'Manual Approval',
        description: 'Always ask for your approval before placing any order. Maximum control.',
    },
];

export function ApprovalModeSettings() {
    const [settings, setSettings] = useState<ApprovalSettings | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setSettings(ApprovalModeService.getSettings());
    }, []);

    const handleModeChange = (mode: ApprovalMode) => {
        if (!settings) return;
        const updated = { ...settings, mode };
        setSettings(updated);
        ApprovalModeService.saveSettings(updated);
        showSaved();
    };

    const handleLimitChange = (limit: number) => {
        if (!settings) return;
        const updated = { ...settings, autoApproveLimit: limit };
        setSettings(updated);
        ApprovalModeService.saveSettings(updated);
        showSaved();
    };

    const showSaved = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (!settings) return null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <CardTitle>Agent Approval Mode</CardTitle>
                    </div>
                    {saved && (
                        <Badge className="bg-green-100 text-green-700">
                            <Check className="h-3 w-3 mr-1" /> Saved
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    Control how the autonomous agent handles purchase decisions
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Mode Selection */}
                <div className="grid gap-3">
                    {MODE_OPTIONS.map(({ mode, icon, label, description }) => (
                        <button
                            key={mode}
                            onClick={() => handleModeChange(mode)}
                            className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${settings.mode === mode
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${settings.mode === mode ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{label}</span>
                                    {settings.mode === mode && (
                                        <Badge className="bg-blue-500 text-white text-xs">Active</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{description}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Semi-Auto Limit Setting */}
                {settings.mode === 'semi-auto' && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <label className="block text-sm font-medium text-yellow-800 mb-2">
                            Auto-Approve Limit (₹)
                        </label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                value={settings.autoApproveLimit}
                                onChange={(e) => handleLimitChange(parseInt(e.target.value) || 0)}
                                className="w-32"
                                min={0}
                                step={100}
                            />
                            <span className="text-sm text-yellow-700">
                                Orders under ₹{settings.autoApproveLimit} will be auto-approved
                            </span>
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• <strong>Auto:</strong> 🤖 Agent handles everything, orders placed instantly</li>
                        <li>• <strong>Semi-Auto:</strong> ⚡ Small orders auto-approved, large ones need you</li>
                        <li>• <strong>Manual:</strong> 👤 You approve every order before it's placed</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
