'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlockchainService, WalletInfo } from '@/services/blockchain';
import { AuditLogService } from '@/services/auditLog';
import { Wallet, Check, X } from 'lucide-react';

export function WalletConnect() {
    const [wallet, setWallet] = useState<WalletInfo | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setWallet(BlockchainService.getWallet());
    }, []);

    const handleConnect = () => {
        setLoading(true);
        try {
            const connectedWallet = BlockchainService.connectWallet();
            setWallet(connectedWallet);

            // Log to audit log
            AuditLogService.logEvent('wallet_connected', {
                address: connectedWallet.address,
            }, true);
        } catch (error) {
            console.error('Failed to connect wallet', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = () => {
        BlockchainService.disconnectWallet();
        setWallet({ ...wallet!, connected: false });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Blockchain Wallet
                </CardTitle>
                <CardDescription>
                    Connect your wallet to enable on-chain audit logs
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {wallet && wallet.connected ? (
                    <>
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center">
                                    <Check className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-emerald-900">Connected</p>
                                    <p className="text-xs text-emerald-700 font-mono">
                                        {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300">
                                {wallet.balance} SOL
                            </Badge>
                        </div>

                        <div className="text-sm text-gray-600">
                            <p>• Audit logs are being recorded on-chain</p>
                            <p>• All transactions are cryptographically signed</p>
                            <p>• Block height: {BlockchainService.getBlockHeight()}</p>
                        </div>

                        <Button variant="outline" onClick={handleDisconnect} className="w-full">
                            Disconnect Wallet
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <X className="h-6 w-6 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Not Connected</p>
                                    <p className="text-xs text-gray-500">Connect to enable blockchain features</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleConnect}
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                            {loading ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
