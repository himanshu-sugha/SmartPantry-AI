// Notification service for pantry alerts

export interface Notification {
    id: string;
    type: 'expiring' | 'low_stock' | 'achievement' | 'purchase' | 'points';
    title: string;
    message: string;
    icon: string;
    timestamp: number;
    read: boolean;
    data?: any;
}

const STORAGE_KEY = 'smartpantry_notifications';

export const NotificationService = {
    // Get all notifications
    getNotifications(): Notification[] {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Get unread count
    getUnreadCount(): number {
        return this.getNotifications().filter(n => !n.read).length;
    },

    // Add notification
    addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
        const notifications = this.getNotifications();

        const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            read: false,
        };

        notifications.unshift(newNotification);

        // Keep only last 50 notifications
        const trimmed = notifications.slice(0, 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

        return newNotification;
    },

    // Mark as read
    markAsRead(id: string): void {
        const notifications = this.getNotifications();
        const index = notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            notifications[index].read = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        }
    },

    // Mark all as read
    markAllAsRead(): void {
        const notifications = this.getNotifications().map(n => ({ ...n, read: true }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    },

    // Clear all
    clearAll(): void {
        localStorage.removeItem(STORAGE_KEY);
    },

    // Helper: Add expiring item notification
    notifyExpiringItem(itemName: string, daysUntilExpiry: number): void {
        this.addNotification({
            type: 'expiring',
            title: 'Item Expiring Soon',
            message: `${itemName} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
            icon: '⚠️',
        });
    },

    // Helper: Add low stock notification  
    notifyLowStock(itemName: string, quantity: number): void {
        this.addNotification({
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `${itemName} is running low (${quantity} left)`,
            icon: '📦',
        });
    },

    // Helper: Add achievement notification
    notifyAchievement(name: string, icon: string): void {
        this.addNotification({
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `You earned: ${name}`,
            icon: icon,
        });
    },

    // Helper: Add points notification
    notifyPoints(points: number, reason: string): void {
        this.addNotification({
            type: 'points',
            title: `+${points} PantryPoints`,
            message: reason,
            icon: '✨',
        });
    },

    // Check for alerts (run on app load)
    async checkForAlerts(): Promise<void> {
        try {
            const { InventoryService } = await import('./inventory');
            const items = await InventoryService.getItems();
            const now = new Date();
            const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            for (const item of items) {
                // Check expiring
                if (item.expiry_date) {
                    const expiry = new Date(item.expiry_date);
                    if (expiry <= sevenDays && expiry >= now) {
                        const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        // Only notify once per item per day
                        const existing = this.getNotifications().find(
                            n => n.type === 'expiring' && n.message.includes(item.name) &&
                                Date.now() - n.timestamp < 24 * 60 * 60 * 1000
                        );
                        if (!existing) {
                            this.notifyExpiringItem(item.name, daysUntil);
                        }
                    }
                }

                // Check low stock
                if (item.quantity <= 2 && item.quantity > 0) {
                    const existing = this.getNotifications().find(
                        n => n.type === 'low_stock' && n.message.includes(item.name) &&
                            Date.now() - n.timestamp < 24 * 60 * 60 * 1000
                    );
                    if (!existing) {
                        this.notifyLowStock(item.name, item.quantity);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to check alerts:', error);
        }
    },
};
