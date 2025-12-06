'use client'

import { useEffect, useState } from 'react';
import { ConsumptionService } from '@/services/consumption';
import { SuggestionsService } from '@/services/suggestions';
import { SpendControlsService } from '@/services/spendControls';
import { InventoryService } from '@/services/inventory';
import { BlockchainService } from '@/services/blockchain';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, Package, ShoppingBag, DollarSign, Leaf,
    AlertTriangle, Calendar, Target, Award, Wallet, Sparkles, ArrowUp, ArrowDown
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AnalyticsData {
    insights: any;
    spendData: any;
    inventory: any[];
    wallet: any;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const insights = SuggestionsService.getConsumptionInsights();
            const spendData = SpendControlsService.getTracker();
            const inventory = await InventoryService.getItems();
            const wallet = BlockchainService.getWallet();

            setData({ insights, spendData, inventory, wallet });
        } catch (error) {
            console.error('Failed to load analytics', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-500">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    // Calculate additional metrics
    const totalItems = data?.inventory.length || 0;
    const expiringItems = data?.inventory.filter(item => {
        if (!item.expiry_date) return false;
        const expiry = new Date(item.expiry_date);
        const now = new Date();
        const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return expiry <= sevenDays && expiry >= now;
    }).length || 0;

    const lowStockItems = data?.inventory.filter(item => item.quantity <= 2).length || 0;
    const spendProgress = data?.spendData?.monthly_limit ?
        (data.spendData.monthly_spent / data.spendData.monthly_limit) * 100 : 0;

    // Category breakdown
    const categoryData = data?.inventory.reduce((acc: any[], item) => {
        const existing = acc.find(c => c.name === item.category);
        if (existing) {
            existing.count++;
        } else {
            acc.push({ name: item.category || 'Other', count: 1 });
        }
        return acc;
    }, []) || [];

    // Mock spending trend data
    const spendingTrend = [
        { month: 'Week 1', spent: Math.random() * 100 + 50 },
        { month: 'Week 2', spent: Math.random() * 100 + 50 },
        { month: 'Week 3', spent: Math.random() * 100 + 50 },
        { month: 'Week 4', spent: data?.spendData?.monthly_spent || 0 },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        Analytics Dashboard
                    </h1>
                    <p className="text-gray-500">
                        Complete insights into your pantry, spending, and sustainability.
                    </p>
                </div>
                {data?.wallet?.connected && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-full border border-amber-200">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span className="font-bold text-amber-700">{data.wallet.pantryPoints} PP</span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="spending">Spending</TabsTrigger>
                    <TabsTrigger value="consumption">Consumption</TabsTrigger>
                    <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <Package className="h-8 w-8 text-emerald-600" />
                                    <Badge variant="secondary" className="bg-emerald-200 text-emerald-800">
                                        Active
                                    </Badge>
                                </div>
                                <p className="text-3xl font-bold text-emerald-900 mt-2">{totalItems}</p>
                                <p className="text-sm text-emerald-600">Items in Pantry</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <DollarSign className="h-8 w-8 text-blue-600" />
                                    <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                                        Monthly
                                    </Badge>
                                </div>
                                <p className="text-3xl font-bold text-blue-900 mt-2">
                                    ${data?.spendData?.monthly_spent?.toFixed(0) || 0}
                                </p>
                                <p className="text-sm text-blue-600">Spent This Month</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                                    {expiringItems > 0 && (
                                        <Badge variant="destructive" className="bg-amber-500">
                                            Action
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-3xl font-bold text-amber-900 mt-2">{expiringItems}</p>
                                <p className="text-sm text-amber-600">Expiring Soon</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <Leaf className="h-8 w-8 text-purple-600" />
                                    <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                                        Saved
                                    </Badge>
                                </div>
                                <p className="text-3xl font-bold text-purple-900 mt-2">
                                    {data?.wallet?.stats?.wastePreventedCount || 0}
                                </p>
                                <p className="text-sm text-purple-600">Items Saved from Waste</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Category Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-emerald-600" />
                                    Inventory by Category
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {categoryData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                dataKey="count"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                            >
                                                {categoryData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-gray-500">
                                        No inventory data yet
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Spending Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                    Spending Trend
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={spendingTrend}>
                                        <defs>
                                            <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']} />
                                        <Area
                                            type="monotone"
                                            dataKey="spent"
                                            stroke="#3b82f6"
                                            fillOpacity={1}
                                            fill="url(#colorSpent)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Budget Progress */}
                    {data?.spendData?.monthly_limit > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-emerald-600" />
                                    Budget Progress
                                </CardTitle>
                                <CardDescription>
                                    ${data.spendData.monthly_spent.toFixed(2)} of ${data.spendData.monthly_limit.toFixed(2)} monthly limit
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Progress
                                    value={Math.min(spendProgress, 100)}
                                    className={`h-4 ${spendProgress > 80 ? 'bg-red-100' : 'bg-emerald-100'}`}
                                />
                                <div className="flex justify-between mt-2 text-sm text-gray-500">
                                    <span>{spendProgress.toFixed(0)}% used</span>
                                    <span>${(data.spendData.monthly_limit - data.spendData.monthly_spent).toFixed(2)} remaining</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Spending Tab */}
                <TabsContent value="spending" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Monthly Spent</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">${data?.spendData?.monthly_spent?.toFixed(2) || '0.00'}</p>
                                <p className="text-xs text-gray-500 mt-1">This month</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Budget Limit</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">${data?.spendData?.monthly_limit?.toFixed(2) || '500.00'}</p>
                                <p className="text-xs text-gray-500 mt-1">Monthly cap</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-emerald-600">
                                    ${data?.wallet?.stats?.totalSavings?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Through smart shopping</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Spending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={spendingTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']} />
                                    <Bar dataKey="spent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Consumption Tab */}
                <TabsContent value="consumption" className="space-y-6">
                    {data?.insights && data.insights.totalLogs > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{data.insights.totalLogs}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Items Consumed</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{data.insights.totalConsumed.toFixed(1)}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Unique Items</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{data.insights.topItems.length}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Most Consumed Items</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={data.insights.topItems} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={100} />
                                            <Tooltip />
                                            <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Leaderboard */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="h-5 w-5 text-amber-500" />
                                        Consumption Leaderboard
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {data.insights.topItems.slice(0, 5).map((item: any, index: number) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full text-lg ${index === 0 ? 'bg-yellow-100' :
                                                        index === 1 ? 'bg-gray-200' :
                                                            index === 2 ? 'bg-orange-100' :
                                                                'bg-blue-50'
                                                        }`}>
                                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                                    </div>
                                                    <span className="font-medium">{item.name}</span>
                                                </div>
                                                <Badge variant="outline">{item.total.toFixed(1)} units</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-semibold mb-2">No Consumption Data</h3>
                                <p className="text-gray-500">
                                    Start tracking item consumption to see insights here.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Sustainability Tab */}
                <TabsContent value="sustainability" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                            <CardContent className="p-4">
                                <Leaf className="h-8 w-8 text-green-600 mb-2" />
                                <p className="text-3xl font-bold text-green-900">
                                    {data?.wallet?.stats?.wastePreventedCount || 0}
                                </p>
                                <p className="text-sm text-green-600">Items Saved from Waste</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
                            <CardContent className="p-4">
                                <TrendingDown className="h-8 w-8 text-teal-600 mb-2" />
                                <p className="text-3xl font-bold text-teal-900">
                                    {expiringItems}
                                </p>
                                <p className="text-sm text-teal-600">Items Expiring (Use Soon!)</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                            <CardContent className="p-4">
                                <Sparkles className="h-8 w-8 text-amber-600 mb-2" />
                                <p className="text-3xl font-bold text-amber-900">
                                    {data?.wallet?.pantryPoints || 0}
                                </p>
                                <p className="text-sm text-amber-600">PantryPoints Earned</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                            <CardContent className="p-4">
                                <Award className="h-8 w-8 text-purple-600 mb-2" />
                                <p className="text-3xl font-bold text-purple-900">
                                    {data?.wallet?.achievements?.length || 0}
                                </p>
                                <p className="text-sm text-purple-600">Achievements Unlocked</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Achievements */}
                    {data?.wallet?.achievements && data.wallet.achievements.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-amber-500" />
                                    Your Achievements
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {data.wallet.achievements.map((achievement: any) => (
                                        <div
                                            key={achievement.id}
                                            className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 text-center"
                                        >
                                            <span className="text-3xl">{achievement.icon}</span>
                                            <p className="font-semibold mt-2">{achievement.name}</p>
                                            <p className="text-xs text-gray-500">{achievement.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sustainability Tips */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Leaf className="h-5 w-5 text-green-600" />
                                Sustainability Tips
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
                                    <span className="text-xl">🥗</span>
                                    <div>
                                        <p className="font-medium">Use Expiring Items First</p>
                                        <p className="text-sm text-gray-600">
                                            {expiringItems > 0
                                                ? `You have ${expiringItems} items expiring soon. Use them first!`
                                                : 'Great job! No items expiring soon.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                                    <span className="text-xl">📊</span>
                                    <div>
                                        <p className="font-medium">Track Consumption Patterns</p>
                                        <p className="text-sm text-gray-600">
                                            Understanding what you use helps reduce waste and save money.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50">
                                    <span className="text-xl">🎯</span>
                                    <div>
                                        <p className="font-medium">Set Spend Limits</p>
                                        <p className="text-sm text-gray-600">
                                            Budget controls help prevent over-purchasing and waste.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
