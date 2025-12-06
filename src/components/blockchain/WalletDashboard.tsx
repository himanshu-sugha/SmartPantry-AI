'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlockchainService, WalletInfo, BlockchainTransaction } from '@/services/blockchain';
import { Wallet, Coins, Trophy, ArrowUpRight, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function WalletDashboard() {
    const [wallet, setWallet] = useState<WalletInfo | null>(null);
    const [recentTxs, setRecentTxs] = useState<BlockchainTransaction[]>([]);

    useEffect(() => {
        setWallet(BlockchainService.getWallet());
        setRecentTxs(BlockchainService.getRecentTransactions(3));
    }, []);

    const handleConnect = () => {
        const connected = BlockchainService.connectWallet();
        setWallet(connected);
    };

    if (!wallet || !wallet.connected) {
        return (
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-purple-900">
                        <Wallet className="h-5 w-5" />
                        Blockchain Wallet
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-purple-700 mb-4">
                        Connect your wallet to earn PantryPoints and unlock achievements!
                    </p>
                    <Button
                        onClick={handleConnect}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-emerald-900">
                        <Wallet className="h-5 w-5" />
                        Wallet Connected
                    </CardTitle>
                    <Link href="/settings?tab=wallet">
                        <Button variant="ghost" size="sm" className="text-emerald-700">
                            <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Points Display */}
                <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <Coins className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-900">{wallet.pantryPoints}</p>
                            <p className="text-xs text-emerald-600">PantryPoints</p>
                        </div>
                    </div>
                    {wallet.achievements.length > 0 && (
                        <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium text-amber-700">
                                {wallet.achievements.length}
                            </span>
                        </div>
                    )}
                </div>

                {/* Achievements */}
                {wallet.achievements.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {wallet.achievements.slice(0, 4).map((achievement) => (
                            <Badge
                                key={achievement.id}
                                variant="secondary"
                                className="bg-white/80 text-xs"
                                title={achievement.description}
                            >
                                {achievement.icon} {achievement.name}
                            </Badge>
                        ))}
                        {wallet.achievements.length > 4 && (
                            <Badge variant="secondary" className="bg-white/80 text-xs">
                                +{wallet.achievements.length - 4} more
                            </Badge>
                        )}
                    </div>
                )}

                {/* Recent Activity */}
                {recentTxs.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Recent Activity
                        </p>
                        <div className="space-y-1">
                            {recentTxs.map((tx) => (
                                <div
                                    key={tx.signature}
                                    className="flex items-center justify-between text-xs bg-white/40 rounded px-2 py-1"
                                >
                                    <span className="text-emerald-800 capitalize">
                                        {tx.type.replace(/_/g, ' ')}
                                    </span>
                                    {tx.points_earned && tx.points_earned > 0 && (
                                        <span className="text-amber-600 font-medium flex items-center gap-1">
                                            <Sparkles className="h-3 w-3" />
                                            +{tx.points_earned} PP
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats Preview */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200">
                    <div className="text-center">
                        <p className="text-lg font-bold text-emerald-900">{wallet.stats.itemsAdded}</p>
                        <p className="text-xs text-emerald-600">Added</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-emerald-900">{wallet.stats.wastePreventedCount}</p>
                        <p className="text-xs text-emerald-600">Saved</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-emerald-900">${wallet.stats.totalSavings.toFixed(0)}</p>
                        <p className="text-xs text-emerald-600">Savings</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
