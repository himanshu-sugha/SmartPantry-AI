'use client'

import { useEffect, useState } from 'react';
import { AuditLogService, AuditLogEntry } from '@/services/auditLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileDown, ExternalLink, User, Bot, Shield } from 'lucide-react';

export function AuditLogViewer() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = () => {
        const recentLogs = AuditLogService.getRecentLogs(100);
        setLogs(recentLogs);
        setStats(AuditLogService.getStatistics());
    };

    const handleExport = () => {
        const json = AuditLogService.exportLogs();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${Date.now()}.json`;
        a.click();
    };

    const getEventIcon = (eventType: string) => {
        switch (eventType) {
            case 'wallet_connected':
            case 'encryption_enabled':
                return <Shield className="h-4 w-4 text-blue-600" />;
            case 'purchase_approved':
            case 'purchase_rejected':
                return <User className="h-4 w-4 text-purple-600" />;
            case 'suggestion_generated':
                return <Bot className="h-4 w-4 text-emerald-600" />;
            default:
                return <div className="h-4 w-4 rounded-full bg-gray-400" />;
        }
    };

    const getEventColor = (eventType: string) => {
        if (eventType.includes('approved')) return 'bg-green-100 text-green-700 border-green-200';
        if (eventType.includes('rejected')) return 'bg-red-100 text-red-700 border-red-200';
        if (eventType.includes('exceeded')) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    return (
        <div className="space-y-6">
            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <div className="text-xs text-gray-500">Total Events</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-purple-600">{stats.userActions}</div>
                            <div className="text-xs text-gray-500">User Actions</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-emerald-600">{stats.aiActions}</div>
                            <div className="text-xs text-gray-500">AI Actions</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-blue-600">{stats.blockchainTxs}</div>
                            <div className="text-xs text-gray-500">Blockchain Txs</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Audit Log */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Audit Trail</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <FileDown className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                        {logs.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No audit logs yet</p>
                                <p className="text-sm">Actions will be recorded here</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="mt-1">{getEventIcon(log.event_type)}</div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className={getEventColor(log.event_type)}>
                                                    {log.event_type.replace(/_/g, ' ')}
                                                </Badge>
                                                {log.user_action ? (
                                                    <Badge variant="outline" className="text-xs">
                                                        <User className="h-3 w-3 mr-1" />
                                                        User
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Bot className="h-3 w-3 mr-1" />
                                                        AI
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="text-sm text-gray-600 mb-1">
                                                {JSON.stringify(log.data).slice(0, 100)}
                                                {JSON.stringify(log.data).length > 100 && '...'}
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                                                {log.blockchain_tx && (
                                                    <span className="flex items-center gap-1 font-mono">
                                                        <ExternalLink className="h-3 w-3" />
                                                        {log.blockchain_tx.slice(0, 8)}...
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
