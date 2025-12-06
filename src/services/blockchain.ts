// Enhanced blockchain service with PantryPoints rewards

export interface BlockchainTransaction {
    signature: string;
    timestamp: number;
    type: TransactionType;
    data: any;
    wallet_address: string;
    block_height: number;
    points_earned?: number;
}

export type TransactionType =
    | 'audit_log'
    | 'approval'
    | 'spend_cap'
    | 'wallet_connect'
    | 'item_added'
    | 'item_consumed'
    | 'purchase_made'
    | 'waste_prevented'
    | 'reward_earned'
    | 'achievement_unlocked';

export interface WalletInfo {
    address: string;
    connected: boolean;
    balance: number; // Mock SOL balance
    pantryPoints: number; // Reward tokens
    achievements: Achievement[];
    stats: WalletStats;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    earned_at: number;
}

export interface WalletStats {
    itemsAdded: number;
    itemsConsumed: number;
    wastePreventedCount: number;
    totalSavings: number;
    purchasesMade: number;
}

// Point values for different actions
const POINT_VALUES = {
    item_added: 1,
    item_consumed: 2,
    waste_prevented: 10,
    purchase_made: 5,
    achievement_unlocked: 25,
};

// Achievement definitions
const ACHIEVEMENTS: Record<string, Omit<Achievement, 'earned_at'>> = {
    first_item: {
        id: 'first_item',
        name: 'First Step',
        description: 'Added your first item to inventory',
        icon: '🎯',
    },
    ten_items: {
        id: 'ten_items',
        name: 'Stocked Up',
        description: 'Added 10 items to inventory',
        icon: '📦',
    },
    waste_warrior: {
        id: 'waste_warrior',
        name: 'Waste Warrior',
        description: 'Prevented 5 items from expiring',
        icon: '♻️',
    },
    smart_shopper: {
        id: 'smart_shopper',
        name: 'Smart Shopper',
        description: 'Completed 5 purchases',
        icon: '🛒',
    },
    century_club: {
        id: 'century_club',
        name: 'Century Club',
        description: 'Earned 100 PantryPoints',
        icon: '💯',
    },
    eco_hero: {
        id: 'eco_hero',
        name: 'Eco Hero',
        description: 'Saved $50 through smart shopping',
        icon: '🌱',
    },
};

const STORAGE_KEY = 'blockchain_transactions';
const WALLET_KEY = 'blockchain_wallet';

export const BlockchainService = {
    // Generate mock wallet address
    generateWalletAddress(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
        let address = '';
        for (let i = 0; i < 44; i++) {
            address += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return address;
    },

    // Generate transaction signature (hash)
    generateSignature(data: any): string {
        const timestamp = Date.now();
        const dataString = JSON.stringify(data) + timestamp;
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
    },

    // Connect wallet (mock)
    connectWallet(): WalletInfo {
        let wallet = this.getWallet();

        if (!wallet) {
            wallet = {
                address: this.generateWalletAddress(),
                connected: true,
                balance: 100,
                pantryPoints: 0,
                achievements: [],
                stats: {
                    itemsAdded: 0,
                    itemsConsumed: 0,
                    wastePreventedCount: 0,
                    totalSavings: 0,
                    purchasesMade: 0,
                },
            };
            localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
        } else {
            wallet.connected = true;
            localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
        }

        return wallet;
    },

    // Disconnect wallet
    disconnectWallet(): void {
        const wallet = this.getWallet();
        if (wallet) {
            wallet.connected = false;
            localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
        }
    },

    // Get wallet info
    getWallet(): WalletInfo | null {
        const walletData = localStorage.getItem(WALLET_KEY);
        if (!walletData) return null;

        const wallet = JSON.parse(walletData);
        // Ensure new fields exist for older wallets
        if (!wallet.pantryPoints) wallet.pantryPoints = 0;
        if (!wallet.achievements) wallet.achievements = [];
        if (!wallet.stats) wallet.stats = {
            itemsAdded: 0,
            itemsConsumed: 0,
            wastePreventedCount: 0,
            totalSavings: 0,
            purchasesMade: 0,
        };
        return wallet;
    },

    // Update wallet
    updateWallet(updates: Partial<WalletInfo>): WalletInfo | null {
        const wallet = this.getWallet();
        if (!wallet) return null;

        const updated = { ...wallet, ...updates };
        localStorage.setItem(WALLET_KEY, JSON.stringify(updated));
        return updated;
    },

    // Add PantryPoints
    addPoints(points: number, reason: string): number {
        const wallet = this.getWallet();
        if (!wallet || !wallet.connected) return 0;

        wallet.pantryPoints += points;
        localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));

        // Check for century club achievement
        if (wallet.pantryPoints >= 100 && !wallet.achievements.find(a => a.id === 'century_club')) {
            this.unlockAchievement('century_club');
        }

        return wallet.pantryPoints;
    },

    // Record action and earn points
    recordAction(
        type: TransactionType,
        data: any = {}
    ): { transaction: BlockchainTransaction; pointsEarned: number } | null {
        const wallet = this.getWallet();
        if (!wallet || !wallet.connected) return null;

        const pointsEarned = POINT_VALUES[type as keyof typeof POINT_VALUES] || 0;

        // Update stats
        if (type === 'item_added') {
            wallet.stats.itemsAdded++;
            // Check achievements
            if (wallet.stats.itemsAdded === 1) this.unlockAchievement('first_item');
            if (wallet.stats.itemsAdded === 10) this.unlockAchievement('ten_items');
        } else if (type === 'item_consumed') {
            wallet.stats.itemsConsumed++;
        } else if (type === 'waste_prevented') {
            wallet.stats.wastePreventedCount++;
            if (wallet.stats.wastePreventedCount === 5) this.unlockAchievement('waste_warrior');
        } else if (type === 'purchase_made') {
            wallet.stats.purchasesMade++;
            if (data.savings) wallet.stats.totalSavings += data.savings;
            if (wallet.stats.purchasesMade === 5) this.unlockAchievement('smart_shopper');
            if (wallet.stats.totalSavings >= 50) this.unlockAchievement('eco_hero');
        }

        // Add points
        if (pointsEarned > 0) {
            wallet.pantryPoints += pointsEarned;
            if (wallet.pantryPoints >= 100 && !wallet.achievements.find(a => a.id === 'century_club')) {
                this.unlockAchievement('century_club');
            }
        }

        localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));

        // Create transaction
        const transaction = this.createTransaction(type, { ...data, pointsEarned });
        transaction.points_earned = pointsEarned;

        return { transaction, pointsEarned };
    },

    // Unlock achievement
    unlockAchievement(achievementId: string): Achievement | null {
        const wallet = this.getWallet();
        if (!wallet || !wallet.connected) return null;

        const achievementDef = ACHIEVEMENTS[achievementId];
        if (!achievementDef) return null;

        // Check if already earned
        if (wallet.achievements.find(a => a.id === achievementId)) return null;

        const achievement: Achievement = {
            ...achievementDef,
            earned_at: Date.now(),
        };

        wallet.achievements.push(achievement);
        wallet.pantryPoints += POINT_VALUES.achievement_unlocked;
        localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));

        // Create achievement transaction
        this.createTransaction('achievement_unlocked', { achievement });

        return achievement;
    },

    // Create transaction
    createTransaction(
        type: TransactionType,
        data: any
    ): BlockchainTransaction {
        const wallet = this.getWallet();
        if (!wallet || !wallet.connected) {
            throw new Error('Wallet not connected');
        }

        const transactions = this.getTransactions();
        const blockHeight = transactions.length + 1;

        const transaction: BlockchainTransaction = {
            signature: this.generateSignature({ type, data, blockHeight }),
            timestamp: Date.now(),
            type,
            data,
            wallet_address: wallet.address,
            block_height: blockHeight,
        };

        transactions.push(transaction);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));

        return transaction;
    },

    // Get all transactions
    getTransactions(): BlockchainTransaction[] {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Get recent transactions
    getRecentTransactions(limit: number = 5): BlockchainTransaction[] {
        const transactions = this.getTransactions();
        return transactions.slice(-limit).reverse();
    },

    // Get transactions by type
    getTransactionsByType(type: TransactionType): BlockchainTransaction[] {
        return this.getTransactions().filter(tx => tx.type === type);
    },

    // Get transaction by signature
    getTransaction(signature: string): BlockchainTransaction | null {
        const transactions = this.getTransactions();
        return transactions.find(tx => tx.signature === signature) || null;
    },

    // Verify transaction exists (mock verification)
    verifyTransaction(signature: string): boolean {
        return this.getTransaction(signature) !== null;
    },

    // Get latest block height
    getBlockHeight(): number {
        const transactions = this.getTransactions();
        return transactions.length;
    },

    // Get total points earned
    getTotalPointsEarned(): number {
        const wallet = this.getWallet();
        return wallet?.pantryPoints || 0;
    },

    // Export wallet data (signed)
    exportWalletData(): string {
        const wallet = this.getWallet();
        const transactions = this.getTransactions();

        const exportData = {
            wallet,
            transactions,
            exportedAt: Date.now(),
            signature: this.generateSignature({ wallet, transactions }),
        };

        return JSON.stringify(exportData, null, 2);
    },

    // Clear all transactions (for testing)
    clearTransactions(): void {
        localStorage.removeItem(STORAGE_KEY);
    },

    // Get available achievements
    getAvailableAchievements(): typeof ACHIEVEMENTS {
        return ACHIEVEMENTS;
    },
};
