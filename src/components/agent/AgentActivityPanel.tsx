'use client'

import { useState, useEffect } from 'react';
import { AutonomousAgentService, AgentState, AgentThought } from '@/services/autonomousAgent';
import { ApprovalModeService } from '@/services/approvalMode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Bot, Brain, Zap, Play, Pause, Trash2,
    Eye, ShoppingCart, CheckCircle, AlertTriangle,
    Clock, Activity, Loader2
} from 'lucide-react';

export function AgentActivityPanel() {
    const [state, setState] = useState<AgentState | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Initialize and load from localStorage
        AutonomousAgentService.init();

        // Get state AFTER init to ensure localStorage is loaded
        const initialState = AutonomousAgentService.getState();
        setState(initialState);
        setIsInitialized(true);

        // Subscribe to updates
        const unsubscribe = AutonomousAgentService.subscribe((newState) => {
            setState(newState);
        });

        return unsubscribe;
    }, []);

    const handleRunCycle = async () => {
        setIsRunning(true);
        await AutonomousAgentService.runCycle();
        setIsRunning(false);
    };

    const handleToggleAutoExecute = (enabled: boolean) => {
        AutonomousAgentService.setAutoExecute(enabled);
    };

    const getThoughtIcon = (type: AgentThought['type']) => {
        switch (type) {
            case 'observation': return <Eye className="h-3 w-3 text-blue-500" />;
            case 'analysis': return <Brain className="h-3 w-3 text-purple-500" />;
            case 'decision': return <Zap className="h-3 w-3 text-yellow-500" />;
            case 'action': return <CheckCircle className="h-3 w-3 text-green-500" />;
            case 'waiting': return <Clock className="h-3 w-3 text-orange-500" />;
            default: return <Activity className="h-3 w-3" />;
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    if (!state) return null;

    const approvalMode = ApprovalModeService.getMode();

    return (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${state.status === 'idle' ? 'bg-gray-100' :
                            state.status === 'executing' ? 'bg-green-100 animate-pulse' :
                                'bg-blue-100 animate-pulse'
                            }`}>
                            <Bot className={`h-6 w-6 ${state.status === 'idle' ? 'text-gray-500' :
                                state.status === 'executing' ? 'text-green-600' :
                                    'text-blue-600'
                                }`} />
                        </div>
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                SmartPantry Agent
                                <Badge variant={state.status === 'idle' ? 'secondary' : 'default'} className="text-xs">
                                    {AutonomousAgentService.getStatusEmoji(state.status)} {AutonomousAgentService.getStatusText(state.status)}
                                </Badge>
                            </CardTitle>
                            {state.currentTask && (
                                <p className="text-sm text-gray-500">{state.currentTask}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            Mode: {approvalMode === 'auto' ? '🤖 Auto' : approvalMode === 'semi-auto' ? '⚡ Semi' : '👤 Manual'}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Control Panel */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={state.autoExecuteEnabled}
                                onCheckedChange={handleToggleAutoExecute}
                                id="auto-execute"
                            />
                            <label htmlFor="auto-execute" className="text-sm font-medium cursor-pointer">
                                Auto-Execute
                            </label>
                        </div>
                        {state.autoExecuteEnabled && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                                🤖 Agent will act autonomously
                            </Badge>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleRunCycle}
                            disabled={isRunning || state.status !== 'idle'}
                            className="gap-1"
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Running...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4" />
                                    Run Cycle
                                </>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => AutonomousAgentService.clearThoughts()}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Agent Thoughts / Activity Log */}
                <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs max-h-48 overflow-y-auto">
                    <div className="text-gray-400 mb-2 flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        Agent Activity Log
                    </div>
                    {state.thoughts.length === 0 ? (
                        <div className="text-gray-500 italic">
                            No activity yet. Click "Run Cycle" to start the agent.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {state.thoughts.slice().reverse().map((thought) => (
                                <div key={thought.id} className="flex items-start gap-2 text-gray-300">
                                    <span className="text-gray-600 shrink-0">{formatTime(thought.timestamp)}</span>
                                    {getThoughtIcon(thought.type)}
                                    <span className={
                                        thought.type === 'action' ? 'text-green-400' :
                                            thought.type === 'decision' ? 'text-yellow-400' :
                                                thought.type === 'waiting' ? 'text-orange-400' :
                                                    'text-gray-300'
                                    }>
                                        {thought.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white rounded-lg p-2 border">
                        <div className="text-lg font-bold text-blue-600">{state.thoughts.length}</div>
                        <div className="text-xs text-gray-500">Thoughts</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                        <div className="text-lg font-bold text-purple-600">{state.pendingActions}</div>
                        <div className="text-xs text-gray-500">Pending</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                        <div className="text-lg font-bold text-green-600">
                            {state.autoExecuteEnabled ? 'ON' : 'OFF'}
                        </div>
                        <div className="text-xs text-gray-500">Auto Mode</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
