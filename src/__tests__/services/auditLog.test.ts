/**
 * SmartPantry AI - Audit Log Service Tests
 * Tests for blockchain audit logging
 */

import { AuditLogService } from '@/services/auditLog';

// Mock BlockchainService
jest.mock('@/services/blockchain', () => ({
    BlockchainService: {
        createTransaction: jest.fn().mockReturnValue({
            signature: 'mock-tx-signature-123',
            timestamp: Date.now(),
        }),
    },
}));

describe('AuditLogService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (localStorage.getItem as jest.Mock).mockReturnValue(null);
    });

    describe('logEvent', () => {
        it('should log an event with correct structure', () => {
            (localStorage.getItem as jest.Mock).mockReturnValue('[]');

            const entry = AuditLogService.logEvent('purchase_approved', { total: 50 }, true);

            expect(entry).toBeDefined();
            expect(entry.event_type).toBe('purchase_approved');
            expect(entry.user_action).toBe(true);
            expect(entry.id).toBeDefined();
            expect(entry.timestamp).toBeDefined();
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        it('should create blockchain transaction when enabled', () => {
            (localStorage.getItem as jest.Mock).mockReturnValue('[]');
            const { BlockchainService } = require('@/services/blockchain');

            AuditLogService.logEvent('purchase_approved', { total: 50 }, false, true);

            expect(BlockchainService.createTransaction).toHaveBeenCalled();
        });
    });

    describe('getLogs', () => {
        it('should return empty array when no logs exist', () => {
            const logs = AuditLogService.getLogs();
            expect(logs).toEqual([]);
        });

        it('should return stored logs', () => {
            const mockLogs = [
                { id: '1', event_type: 'purchase_approved', timestamp: Date.now(), user_action: true },
            ];
            (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockLogs));

            const logs = AuditLogService.getLogs();
            expect(logs).toHaveLength(1);
            expect(logs[0].event_type).toBe('purchase_approved');
        });
    });

    describe('getLogsByType', () => {
        it('should filter logs by event type', () => {
            const mockLogs = [
                { id: '1', event_type: 'purchase_approved', timestamp: Date.now(), user_action: false },
                { id: '2', event_type: 'spend_cap_set', timestamp: Date.now(), user_action: true },
                { id: '3', event_type: 'purchase_approved', timestamp: Date.now(), user_action: false },
            ];
            (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockLogs));

            const purchaseLogs = AuditLogService.getLogsByType('purchase_approved');
            expect(purchaseLogs).toHaveLength(2);
        });
    });

    describe('getStatistics', () => {
        it('should calculate correct statistics', () => {
            const mockLogs = [
                { id: '1', event_type: 'purchase_approved', timestamp: Date.now(), user_action: true },
                { id: '2', event_type: 'purchase_approved', timestamp: Date.now(), user_action: false },
                { id: '3', event_type: 'item_added', timestamp: Date.now(), user_action: true },
            ];
            (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockLogs));

            const stats = AuditLogService.getStatistics();
            expect(stats.total).toBe(3);
            expect(stats.userActions).toBe(2);
            expect(stats.aiActions).toBe(1);
        });
    });
});
