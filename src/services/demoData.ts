// Demo data generator for hackathon presentation

import { InventoryItem } from '@/types/inventory';
import { ConsumptionService } from '@/services/consumption';
import { AuditLogService } from '@/services/auditLog';
import { BlockchainService } from '@/services/blockchain';
import { SpendControlsService } from '@/services/spendControls';

export const DemoDataService = {
    // Generate sample inventory items
    generateInventory(): InventoryItem[] {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        return [
            {
                id: 'demo-1',
                name: 'Milk',
                category: 'Dairy',
                quantity: 2,
                unit: 'liters',
                expiry_date: nextWeek.toISOString().split('T')[0],
                user_id: 'user-123',
                created_at: new Date().toISOString(),
            },
            {
                id: 'demo-2',
                name: 'Eggs',
                category: 'Dairy',
                quantity: 6,
                unit: 'pcs',
                expiry_date: nextWeek.toISOString().split('T')[0],
                user_id: 'user-123',
                created_at: new Date().toISOString(),
            },
            {
                id: 'demo-3',
                name: 'Bread',
                category: 'Pantry',
                quantity: 1,
                unit: 'loaf',
                expiry_date: tomorrow.toISOString().split('T')[0],
                user_id: 'user-123',
                created_at: new Date().toISOString(),
            },
            {
                id: 'demo-4',
                name: 'Apples',
                category: 'Produce',
                quantity: 8,
                unit: 'pcs',
                expiry_date: nextWeek.toISOString().split('T')[0],
                user_id: 'user-123',
                created_at: new Date().toISOString(),
            },
            {
                id: 'demo-5',
                name: 'Chicken Breast',
                category: 'Meat',
                quantity: 1,
                unit: 'kg',
                expiry_date: tomorrow.toISOString().split('T')[0],
                user_id: 'user-123',
                created_at: new Date().toISOString(),
            },
            {
                id: 'demo-6',
                name: 'Rice',
                category: 'Pantry',
                quantity: 5,
                unit: 'kg',
                expiry_date: nextMonth.toISOString().split('T')[0],
                user_id: 'user-123',
                created_at: new Date().toISOString(),
            },
            {
                id: 'demo-7',
                name: 'Orange Juice',
                category: 'Beverages',
                quantity: 1,
                unit: 'liters',
                expiry_date: nextWeek.toISOString().split('T')[0],
                user_id: 'user-123',
                created_at: new Date().toISOString(),
            },
            {
                id: 'demo-8',
                name: 'Pasta',
                category: 'Pantry',
                quantity: 3,
                unit: 'packs',
                expiry_date: nextMonth.toISOString().split('T')[0],
                user_id: 'user-123',
                created_at: new Date().toISOString(),
            },
        ];
    },

    // Generate sample consumption logs
    generateConsumptionLogs() {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        // Milk consumption over 7 days
        for (let i = 7; i >= 1; i--) {
            ConsumptionService.logConsumption(
                'demo-1',
                'Milk',
                0.5
            );
            // Manually set timestamp for demo
            const logs = ConsumptionService.getLogs();
            if (logs.length > 0) {
                logs[logs.length - 1].timestamp = new Date(now - i * dayMs).toISOString();
            }
        }

        // Eggs consumption
        for (let i = 5; i >= 1; i--) {
            ConsumptionService.logConsumption('demo-2', 'Eggs', 2);
            const logs = ConsumptionService.getLogs();
            if (logs.length > 0) {
                logs[logs.length - 1].timestamp = new Date(now - i * dayMs).toISOString();
            }
        }

        // Bread consumption
        for (let i = 3; i >= 1; i--) {
            ConsumptionService.logConsumption('demo-3', 'Bread', 0.3);
            const logs = ConsumptionService.getLogs();
            if (logs.length > 0) {
                logs[logs.length - 1].timestamp = new Date(now - i * dayMs).toISOString();
            }
        }
    },

    // Generate sample audit logs
    generateAuditLogs() {
        // Connect wallet
        BlockchainService.connectWallet();
        AuditLogService.logEvent('wallet_connected', {
            address: BlockchainService.getWallet()?.address,
        }, true);

        // Set spend caps
        AuditLogService.logEvent('spend_cap_set', {
            daily: 50,
            weekly: 200,
            monthly: 500,
        }, true);

        // Items added
        AuditLogService.logEvent('item_added', {
            item_name: 'Milk',
            category: 'Dairy',
            quantity: 2,
        }, true);

        // Suggestions generated
        AuditLogService.logEvent('suggestion_generated', {
            items: ['Milk', 'Bread', 'Eggs'],
            total_value: 15.99,
        }, false);

        // Purchase approved
        AuditLogService.logEvent('purchase_approved', {
            item: 'Milk',
            price: 4.99,
            vendor: 'Amazon',
        }, true);
    },

    // Initialize all demo data
    initializeDemoData() {
        console.log('🎬 Initializing demo data...');

        // Connect wallet
        BlockchainService.connectWallet();

        // Set spend controls
        SpendControlsService.updateConfig({
            daily_cap: 50,
            weekly_cap: 200,
            monthly_cap: 500,
            approval_mode: 'hybrid',
            auto_approval_threshold: 20,
        });

        // Generate consumption logs
        this.generateConsumptionLogs();

        // Generate audit logs
        this.generateAuditLogs();

        console.log('✅ Demo data initialized!');
        console.log('📊 Consumption logs:', ConsumptionService.getLogs().length);
        console.log('📝 Audit logs:', AuditLogService.getLogs().length);
        console.log('⛓️ Blockchain txs:', BlockchainService.getTransactions().length);
    },

    // Clear all demo data
    clearDemoData() {
        ConsumptionService.clearAllLogs();
        AuditLogService.clearLogs();
        BlockchainService.clearTransactions();
        BlockchainService.disconnectWallet();
        console.log('🗑️ Demo data cleared');
    },
};

// Auto-initialize on first load (for demo purposes)
if (typeof window !== 'undefined') {
    const hasInitialized = localStorage.getItem('demo_initialized');
    if (!hasInitialized) {
        DemoDataService.initializeDemoData();
        localStorage.setItem('demo_initialized', 'true');
    }
}
