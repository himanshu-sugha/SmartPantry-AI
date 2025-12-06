
'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ShoppingCart, Package, BarChart2, Settings, ShieldCheck } from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Shopping List', href: '/shopping-list', icon: ShoppingCart },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    { name: 'Privacy & Audit', href: '/settings?tab=audit', icon: ShieldCheck },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
            <div className="flex h-16 items-center justify-center border-b border-gray-800">
                <h1 className="text-xl font-bold text-emerald-400">SmartPantry AI</h1>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
                {navigation.map((item) => {
                    // Check if the current path matches the item's href
                    // For links with query params (like settings?tab=audit), we need to check both path and params
                    let isActive = false

                    if (item.href.includes('?')) {
                        // For query param links, check if we're on the right path AND have the right param
                        const [path, query] = item.href.split('?')
                        const [key, value] = query.split('=')
                        isActive = pathname === path && searchParams.get(key) === value
                    } else {
                        // For normal links, just check the path
                        // Also handle the case where we are on a sub-path (except root)
                        isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))

                        // Special case: if we are on settings page with a tab param, the main 'Settings' link should NOT be active
                        // unless it's the default tab (which we can't easily know here, so we'll just assume if there's a tab param, it's not the main settings link)
                        if (item.href === '/settings' && searchParams.has('tab')) {
                            isActive = false
                        }
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                                'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    isActive ? 'text-emerald-400' : 'text-gray-400 group-hover:text-emerald-400',
                                    'mr-3 h-6 w-6 flex-shrink-0'
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
            <div className="border-t border-gray-800 p-4">
                <Link href="/settings" className="flex items-center hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-medium">
                        U
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-white">User</p>
                        <p className="text-xs text-gray-400">View Profile →</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}
