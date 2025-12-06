'use client'

import { useState, useEffect, useRef } from 'react';
import { AutonomousAgentService, AgentState, AgentThought } from '@/services/autonomousAgent';
import { ApprovalModeService, ApprovalMode } from '@/services/approvalMode';
import { SpendControlsService } from '@/services/spendControls';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
    Bot, Brain, Zap, Play,
    Eye, CheckCircle, Clock, Activity,
    Loader2, ChevronRight, ChevronDown,
    ShoppingCart, AlertTriangle, Settings,
    Shield, DollarSign, User
} from 'lucide-react';
import Link from 'next/link';

export function AgentSidebar() {
    const [state, setState] = useState<AgentState | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [approvalMode, setApprovalMode] = useState<ApprovalMode>('manual');
    const [spendConfig, setSpendConfig] = useState({ daily: 5000, weekly: 10000 });
    const [autoApproveLimit, setAutoApproveLimit] = useState(500);
    const activityLogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        AutonomousAgentService.init();
        setState(AutonomousAgentService.getState());
        setApprovalMode(ApprovalModeService.getMode());
        const settings = ApprovalModeService.getSettings();
        setAutoApproveLimit(settings.autoApproveLimit);
        const config = SpendControlsService.getConfig();
        setSpendConfig({ daily: config.daily_cap, weekly: config.weekly_cap });

        const unsubscribe = AutonomousAgentService.subscribe(setState);
        return unsubscribe;
    }, []);

    useEffect(() => {
        // Auto-scroll to bottom when thoughts change
        if (activityLogRef.current && state?.thoughts) {
            // Use setTimeout to ensure DOM has updated
            setTimeout(() => {
                if (activityLogRef.current) {
                    activityLogRef.current.scrollTop = activityLogRef.current.scrollHeight;
                }
            }, 50);
        }
    }, [state?.thoughts, state?.thoughts?.length]);

    const handleRunCycle = async () => {
        setIsRunning(true);
        await AutonomousAgentService.runCycle();
        setIsRunning(false);
    };

    const handleToggleAutoExecute = (enabled: boolean) => {
        AutonomousAgentService.setAutoExecute(enabled);
    };

    const handleModeChange = (mode: ApprovalMode) => {
        setApprovalMode(mode);
        ApprovalModeService.setMode(mode);
    };

    const handleAutoLimitChange = (value: number) => {
        setAutoApproveLimit(value);
        ApprovalModeService.saveSettings({ autoApproveLimit: value });
    };

    const handleSpendChange = (field: 'daily' | 'weekly', value: number) => {
        setSpendConfig(prev => ({ ...prev, [field]: value }));
        SpendControlsService.updateConfig({
            [field === 'daily' ? 'daily_cap' : 'weekly_cap']: value
        });
    };

    const getThoughtIcon = (type: AgentThought['type']) => {
        switch (type) {
            case 'observation': return <Eye className="h-3 w-3 text-blue-400" />;
            case 'analysis': return <Brain className="h-3 w-3 text-purple-400" />;
            case 'decision': return <Zap className="h-3 w-3 text-yellow-400" />;
            case 'action': return <CheckCircle className="h-3 w-3 text-green-400" />;
            case 'waiting': return <Clock className="h-3 w-3 text-orange-400" />;
            default: return <Activity className="h-3 w-3" />;
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (!state) return null;

    // Minimized state
    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed right-4 bottom-4 z-50 p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
                <Bot className={`h-6 w-6 ${state.status !== 'idle' ? 'animate-pulse' : ''}`} />
                {state.pendingActions > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {state.pendingActions}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-40 flex flex-col border-l border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gradient-to-r from-blue-900 to-indigo-900">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${state.status === 'idle' ? 'bg-gray-700' :
                        state.status === 'executing' ? 'bg-green-600 animate-pulse' :
                            'bg-blue-600 animate-pulse'
                        }`}>
                        <Bot className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm">SmartPantry Agent</h2>
                        <p className="text-[10px] text-gray-400">
                            {AutonomousAgentService.getStatusEmoji(state.status)} {AutonomousAgentService.getStatusText(state.status)}
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-gray-700 rounded">
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {/* Main Controls */}
            <div className="p-3 border-b border-gray-800 space-y-3">
                {/* Auto Execute */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Switch checked={state.autoExecuteEnabled} onCheckedChange={handleToggleAutoExecute} />
                        <span className="text-xs">Auto-Execute</span>
                    </div>
                    <Badge className={`text-[10px] ${state.autoExecuteEnabled ? 'bg-green-600' : 'bg-gray-600'}`}>
                        {state.autoExecuteEnabled ? 'ON' : 'OFF'}
                    </Badge>
                </div>

                {/* Run Button */}
                <Button
                    onClick={handleRunCycle}
                    disabled={isRunning || state.status !== 'idle'}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-8 text-xs"
                >
                    {isRunning ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running...</>
                    ) : (
                        <><Play className="h-3 w-3 mr-1" />Run Agent Cycle</>
                    )}
                </Button>
            </div>

            {/* Settings Panel - Collapsible */}
            <div className="border-b border-gray-800">
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-full p-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                >
                    <div className="flex items-center gap-2 text-xs">
                        <Settings className="h-3 w-3" />
                        Agent Settings
                    </div>
                    {showSettings ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>

                {showSettings && (
                    <div className="px-3 pb-3 space-y-3">
                        {/* Approval Mode */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Shield className="h-3 w-3" /> Approval Mode
                            </label>
                            <div className="grid grid-cols-3 gap-1">
                                {(['auto', 'semi-auto', 'manual'] as ApprovalMode[]).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => handleModeChange(mode)}
                                        className={`p-1.5 rounded text-[10px] transition-colors ${approvalMode === mode
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        {mode === 'auto' ? '🤖 Auto' : mode === 'semi-auto' ? '⚡ Semi' : '👤 Manual'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Semi-Auto Limit */}
                        {approvalMode === 'semi-auto' && (
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-400">Auto-approve under ₹</label>
                                <Input
                                    type="number"
                                    value={autoApproveLimit}
                                    onChange={(e) => handleAutoLimitChange(parseInt(e.target.value) || 0)}
                                    className="h-7 text-xs bg-gray-800 border-gray-700"
                                />
                            </div>
                        )}

                        {/* Spend Caps */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-400 flex items-center gap-1">
                                <DollarSign className="h-3 w-3" /> Spend Limits
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-gray-500">Daily ₹</label>
                                    <Input
                                        type="number"
                                        value={spendConfig.daily}
                                        onChange={(e) => handleSpendChange('daily', parseInt(e.target.value) || 0)}
                                        className="h-7 text-xs bg-gray-800 border-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500">Weekly ₹</label>
                                    <Input
                                        type="number"
                                        value={spendConfig.weekly}
                                        onChange={(e) => handleSpendChange('weekly', parseInt(e.target.value) || 0)}
                                        className="h-7 text-xs bg-gray-800 border-gray-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Activity Log */}
            <div ref={activityLogRef} className="flex-1 overflow-y-auto p-2 flex flex-col">
                <div className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-1">
                    <Activity className="h-3 w-3" />Activity Log
                </div>
                {state.thoughts.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <Bot className="h-6 w-6 mx-auto mb-1 opacity-50" />
                            <p className="text-[10px]">Agent is idle</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1.5 mt-auto">
                        {state.thoughts.map((thought) => (
                            <div
                                key={thought.id}
                                className={`p-1.5 rounded text-[10px] ${thought.type === 'action' ? 'bg-green-900/30 border border-green-800' :
                                    thought.type === 'decision' ? 'bg-yellow-900/30 border border-yellow-800' :
                                        thought.type === 'waiting' ? 'bg-orange-900/30 border border-orange-800' :
                                            'bg-gray-800/50'
                                    }`}
                            >
                                <div className="flex items-center gap-1 mb-0.5">
                                    {getThoughtIcon(thought.type)}
                                    <span className="text-gray-500">{formatTime(thought.timestamp)}</span>
                                </div>
                                <p className="text-gray-300 whitespace-pre-wrap">{thought.message}</p>
                            </div>
                        ))}

                        {/* Pending Actions Card - Inside Chat */}
                        {state.pendingActions > 0 && (
                            <div className="p-2 bg-orange-900/50 border border-orange-600 rounded">
                                <div className="flex items-center gap-2 text-orange-200 text-xs mb-2">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span className="font-semibold">🛒 {state.pendingActions} items in cart</span>
                                </div>
                                <p className="text-[10px] text-orange-300/80 mb-2">
                                    Waiting for your approval to complete purchase.
                                </p>
                                <Link href="/shopping-list">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-7 text-[10px] text-orange-200 border-orange-600 hover:bg-orange-800"
                                        onClick={() => {
                                            // Clear pending when user clicks checkout
                                            AutonomousAgentService.addThought('action', '👆 User clicked to review cart...');
                                        }}
                                    >
                                        <ShoppingCart className="h-3 w-3 mr-1" />Review & Checkout
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-800 bg-gray-800/50">
                <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                    <div>
                        <div className="font-bold text-blue-400">{state.thoughts.length}</div>
                        <div className="text-gray-500">Logs</div>
                    </div>
                    <div>
                        <div className="font-bold text-purple-400">{state.pendingActions}</div>
                        <div className="text-gray-500">Pending</div>
                    </div>
                    <div>
                        <div className={`font-bold ${state.autoExecuteEnabled ? 'text-green-400' : 'text-gray-400'}`}>
                            {state.autoExecuteEnabled ? 'ON' : 'OFF'}
                        </div>
                        <div className="text-gray-500">Auto</div>
                    </div>
                    <div>
                        <div className="font-bold text-yellow-400">
                            {approvalMode === 'auto' ? '🤖' : approvalMode === 'semi-auto' ? '⚡' : '👤'}
                        </div>
                        <div className="text-gray-500">Mode</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
