'use client'

import dynamic from 'next/dynamic';

const AgentSidebar = dynamic(
    () => import('@/components/agent/AgentSidebar').then(m => m.AgentSidebar),
    { ssr: false }
);

export function AgentSidebarWrapper() {
    return <AgentSidebar />;
}
