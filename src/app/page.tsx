'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, AlertTriangle, DollarSign, TrendingUp, TrendingDown, Bot } from 'lucide-react';
import { InventoryService } from '@/services/inventory';
import { ConsumptionService } from '@/services/consumption';
import { SpendControlsService } from '@/services/spendControls';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const WalletDashboard = dynamic(() => import('@/components/blockchain/WalletDashboard').then(m => m.WalletDashboard), { ssr: false });
const AgentActivityPanel = dynamic(() => import('@/components/agent/AgentActivityPanel').then(m => m.AgentActivityPanel), { ssr: false });

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    expiringItems: 0,
    totalConsumed: 0,
    monthlySpend: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get inventory data
      const items = await InventoryService.getItems();
      const totalItems = items.length;
      const lowStockItems = items.filter(item => item.quantity <= (item.min_quantity ?? 1)).length;

      // Get expiring items (within 7 days)
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const expiringItems = items.filter(item => {
        if (!item.expiry_date) return false;
        const expiryDate = new Date(item.expiry_date);
        return expiryDate <= sevenDaysFromNow && expiryDate >= now;
      }).length;

      // Get consumption data
      const consumptionLogs = ConsumptionService.getRecentLogs(30);
      const totalConsumed = consumptionLogs.reduce((sum, log) => sum + log.quantity_used, 0);

      // Get spend data
      const spendTracker = SpendControlsService.getTracker();
      const monthlySpend = spendTracker.monthly_spent;

      setStats({
        totalItems,
        lowStockItems,
        expiringItems,
        totalConsumed,
        monthlySpend,
      });
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500 dark:text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome to SmartPantry AI - Your autonomous shopping assistant</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-gray-500 mt-1">
              In your pantry
            </p>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockItems}</div>
            <p className="text-xs text-gray-500 mt-1">
              Items need reordering
            </p>
            {stats.lowStockItems > 0 && (
              <Link href="/shopping-list">
                <Button variant="link" className="p-0 h-auto text-xs mt-2">
                  View suggestions →
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiringItems}</div>
            <p className="text-xs text-gray-500 mt-1">
              Within 7 days
            </p>
            {stats.expiringItems > 0 && (
              <Link href="/inventory">
                <Button variant="link" className="p-0 h-auto text-xs mt-2">
                  Check inventory →
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Monthly Spend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlySpend.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.totalConsumed > 0 ? (
                <>
                  <div className="flex items-center gap-3 text-sm">
                    <TrendingDown className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">
                      {stats.totalConsumed.toFixed(1)} items consumed this month
                    </span>
                  </div>
                  <Link href="/analytics">
                    <Button variant="outline" className="w-full">
                      View Analytics
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-sm text-gray-500 py-4 text-center">
                  No consumption data yet. Start tracking usage!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Wallet Dashboard */}
        <WalletDashboard />

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/inventory">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Manage Inventory
                </Button>
              </Link>
              <Link href="/shopping-list">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  View Shopping List
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Spend Controls
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      {stats.totalItems === 0 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-emerald-900 mb-2">
              👋 Welcome to SmartPantry AI!
            </h3>
            <p className="text-emerald-700 mb-4">
              Get started by adding items to your inventory. You can add items manually, scan receipts, or use your camera.
            </p>
            <Link href="/inventory">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Add Your First Item
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
