'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SpendControlsService, SpendConfig } from '@/services/spendControls';
import { AuditLogService } from '@/services/auditLog';
import { DollarSign, Shield, CheckCircle } from 'lucide-react';

export function SpendCapSettings() {
    const [config, setConfig] = useState<SpendConfig>(SpendControlsService.getDefaultConfig());
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setConfig(SpendControlsService.getConfig());
    }, []);

    const handleSave = () => {
        SpendControlsService.updateConfig(config);

        // Log to audit log
        AuditLogService.logEvent('spend_cap_set', config, true);

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const remaining = SpendControlsService.getRemainingBudget();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Spend Controls
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Approval Mode */}
                <div className="space-y-2">
                    <Label>Approval Mode</Label>
                    <Select
                        value={config.approval_mode}
                        onValueChange={(value: any) => setConfig({ ...config, approval_mode: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">
                                <div className="flex items-center gap-2">
                                    <span>🤖 Auto</span>
                                    <span className="text-xs text-gray-500">- Agent decides</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="manual">
                                <div className="flex items-center gap-2">
                                    <span>👤 Manual</span>
                                    <span className="text-xs text-gray-500">- You approve all</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="hybrid">
                                <div className="flex items-center gap-2">
                                    <span>⚡ Hybrid</span>
                                    <span className="text-xs text-gray-500">- Auto under threshold</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Auto Approval Threshold */}
                {config.approval_mode === 'hybrid' && (
                    <div className="space-y-2">
                        <Label>Auto-Approval Threshold: ${config.auto_approval_threshold}</Label>
                        <Slider
                            value={[config.auto_approval_threshold]}
                            onValueChange={([value]) => setConfig({ ...config, auto_approval_threshold: value })}
                            min={5}
                            max={100}
                            step={5}
                        />
                        <p className="text-xs text-gray-500">
                            Purchases under this amount are auto-approved
                        </p>
                    </div>
                )}

                {/* Daily Cap */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Daily Cap: ${config.daily_cap}</Label>
                        <Badge variant="outline" className="text-xs">
                            ${remaining.daily.toFixed(2)} remaining
                        </Badge>
                    </div>
                    <Slider
                        value={[config.daily_cap]}
                        onValueChange={([value]) => setConfig({ ...config, daily_cap: value })}
                        min={10}
                        max={200}
                        step={10}
                    />
                </div>

                {/* Weekly Cap */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Weekly Cap: ${config.weekly_cap}</Label>
                        <Badge variant="outline" className="text-xs">
                            ${remaining.weekly.toFixed(2)} remaining
                        </Badge>
                    </div>
                    <Slider
                        value={[config.weekly_cap]}
                        onValueChange={([value]) => setConfig({ ...config, weekly_cap: value })}
                        min={50}
                        max={500}
                        step={25}
                    />
                </div>

                {/* Monthly Cap */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Monthly Cap: ${config.monthly_cap}</Label>
                        <Badge variant="outline" className="text-xs">
                            ${remaining.monthly.toFixed(2)} remaining
                        </Badge>
                    </div>
                    <Slider
                        value={[config.monthly_cap]}
                        onValueChange={([value]) => setConfig({ ...config, monthly_cap: value })}
                        min={100}
                        max={2000}
                        step={50}
                    />
                </div>

                <Button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {saved ? (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Saved!
                        </>
                    ) : (
                        'Save Settings'
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
