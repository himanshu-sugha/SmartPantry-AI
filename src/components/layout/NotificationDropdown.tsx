'use client'

import { useState, useEffect } from 'react';
import { NotificationService, Notification } from '@/services/notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2, X } from 'lucide-react';

export function NotificationDropdown() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadNotifications();
        // Check for new alerts on mount
        NotificationService.checkForAlerts().then(() => loadNotifications());

        // Refresh every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = () => {
        setNotifications(NotificationService.getNotifications());
        setUnreadCount(NotificationService.getUnreadCount());
    };

    const handleMarkAsRead = (id: string) => {
        NotificationService.markAsRead(id);
        loadNotifications();
    };

    const handleMarkAllAsRead = () => {
        NotificationService.markAllAsRead();
        loadNotifications();
    };

    const handleClearAll = () => {
        NotificationService.clearAll();
        loadNotifications();
    };

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" aria-hidden="true" />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <div className="flex gap-1">
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleMarkAllAsRead}
                                        className="h-7 px-2 text-xs"
                                    >
                                        <Check className="h-3 w-3 mr-1" />
                                        Read All
                                    </Button>
                                )}
                                {notifications.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearAll}
                                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.slice(0, 10).map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-emerald-50/50' : ''
                                                }`}
                                            onClick={() => handleMarkAsRead(notification.id)}
                                        >
                                            <span className="text-xl flex-shrink-0">{notification.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatTime(notification.timestamp)}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {notifications.length > 10 && (
                            <div className="border-t border-gray-100 px-4 py-2">
                                <p className="text-xs text-gray-500 text-center">
                                    +{notifications.length - 10} more notifications
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
