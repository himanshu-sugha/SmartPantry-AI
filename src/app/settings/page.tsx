'use client'

import { WalletConnect } from '@/components/blockchain/WalletConnect';
import { SpendCapSettings } from '@/components/settings/SpendCapSettings';
import { ApprovalModeSettings } from '@/components/settings/ApprovalModeSettings';
import { AuditLogViewer } from '@/components/blockchain/AuditLogViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Wallet, Shield, FileText, Bot } from 'lucide-react';

export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from 'next/navigation';

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentTab = searchParams.get('tab') || 'agent';

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.push(`/settings?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    <SettingsIcon className="h-8 w-8" />
                    Settings
                </h1>
                <p className="text-gray-500">Manage agent behavior, privacy, and spend controls.</p>
            </div>

            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="agent" className="gap-2">
                        <Bot className="h-4 w-4" />
                        Agent
                    </TabsTrigger>
                    <TabsTrigger value="spend" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Spend Caps
                    </TabsTrigger>
                    <TabsTrigger value="wallet" className="gap-2">
                        <Wallet className="h-4 w-4" />
                        Wallet
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Audit Log
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="agent" className="space-y-4">
                    <ApprovalModeSettings />
                </TabsContent>

                <TabsContent value="spend" className="space-y-4">
                    <SpendCapSettings />
                </TabsContent>

                <TabsContent value="wallet" className="space-y-4">
                    <WalletConnect />
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                    <AuditLogViewer />
                </TabsContent>
            </Tabs>
        </div>
    );
}

