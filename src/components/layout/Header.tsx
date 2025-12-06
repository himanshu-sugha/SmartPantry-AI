'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Package, Sun, Moon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { InventoryService } from '@/services/inventory'
import { InventoryItem } from '@/types/inventory'

const NotificationDropdown = dynamic(
    () => import('./NotificationDropdown').then(m => m.NotificationDropdown),
    { ssr: false }
)

// Simple theme hook that works without context
function useThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        const saved = localStorage.getItem('smartpantry_theme');
        if (saved === 'light' || saved === 'dark') {
            setTheme(saved);
            document.documentElement.classList.toggle('dark', saved === 'dark');
        }
    }, []);

    const toggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('smartpantry_theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    return { theme, toggle };
}

export function Header() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<InventoryItem[]>([])
    const [showResults, setShowResults] = useState(false)
    const [loading, setLoading] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const { theme, toggle: toggleTheme } = useThemeToggle()

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Search as user types
    useEffect(() => {
        const searchItems = async () => {
            if (query.trim().length === 0) {
                setResults([])
                return
            }

            setLoading(true)
            try {
                const items = await InventoryService.getItems()
                const filtered = items.filter(item =>
                    item.name.toLowerCase().includes(query.toLowerCase()) ||
                    item.category.toLowerCase().includes(query.toLowerCase())
                )
                setResults(filtered.slice(0, 5))
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                setLoading(false)
            }
        }

        const debounce = setTimeout(searchItems, 200)
        return () => clearTimeout(debounce)
    }, [query])

    const handleSelect = (item: InventoryItem) => {
        setQuery('')
        setShowResults(false)
        router.push(`/inventory?search=${encodeURIComponent(item.name)}`)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            setShowResults(false)
            router.push(`/inventory?search=${encodeURIComponent(query)}`)
        }
    }

    const clearSearch = () => {
        setQuery('')
        setResults([])
    }

    return (
        <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6">
            <div className="flex items-center flex-1 max-w-md" ref={searchRef}>
                <form onSubmit={handleSubmit} className="relative w-full">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setShowResults(true)
                        }}
                        onFocus={() => query && setShowResults(true)}
                        className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-gray-900 dark:text-white dark:bg-gray-800 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                        placeholder="Search inventory..."
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    {/* Search Results Dropdown */}
                    {showResults && query && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    Searching...
                                </div>
                            ) : results.length > 0 ? (
                                <div className="py-1">
                                    {results.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleSelect(item)}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                                        >
                                            <Package className="h-4 w-4 text-gray-400" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {item.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {item.category} • {item.quantity} {item.unit}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                    <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2">
                                        <button
                                            type="submit"
                                            className="text-xs text-emerald-600 hover:text-emerald-700"
                                        >
                                            See all results for "{query}" →
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No items found for "{query}"
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </div>
            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {theme === 'dark' ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                </button>
                <NotificationDropdown />
            </div>
        </header>
    )
}

