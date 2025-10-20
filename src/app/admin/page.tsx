/**
 * Admin Dashboard - Overview Page
 * Shows key metrics, recent activity, and system status
 */

'use client';

import { useEffect, useState } from 'react';
import {
    Users,
    DollarSign,
    CreditCard,
    TrendingUp,
    Activity,
    Package,
} from 'lucide-react';

interface DashboardStats {
    totalUsers: number;
    activeSubscribers: number;
    totalRevenue: number;
    monthlyRevenue: number;
    tokensSold: number;
    tokensUsed: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    const statCards = [
        {
            name: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: Users,
            color: 'blue',
            change: '+12.5%',
        },
        {
            name: 'Active Subscribers',
            value: stats?.activeSubscribers || 0,
            icon: CreditCard,
            color: 'green',
            change: '+8.2%',
        },
        {
            name: 'Monthly Revenue',
            value: `$${((stats?.monthlyRevenue || 0) / 100).toFixed(2)}`,
            icon: DollarSign,
            color: 'purple',
            change: '+23.1%',
        },
        {
            name: 'Tokens Sold',
            value: stats?.tokensSold || 0,
            icon: Package,
            color: 'orange',
            change: '+15.3%',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-2 text-gray-600">
                    Welcome back! Here's what's happening with your platform.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.name}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="mt-2 text-sm text-green-600 font-medium">
                                        {stat.change} from last month
                                    </p>
                                </div>
                                <div className={`p-3 bg-${stat.color}-50 rounded-lg`}>
                                    <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Activity & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
                        <TrendingUp className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Revenue</span>
                            <span className="text-lg font-bold text-gray-900">
                                ${((stats?.totalRevenue || 0) / 100).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">This Month</span>
                            <span className="text-lg font-bold text-green-600">
                                ${((stats?.monthlyRevenue || 0) / 100).toFixed(2)}
                            </span>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                            <div className="text-center text-sm text-gray-500">
                                Revenue chart coming soon...
                            </div>
                        </div>
                    </div>
                </div>

                {/* Token Usage */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Token Usage</h2>
                        <Activity className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Tokens Sold</span>
                            <span className="text-lg font-bold text-gray-900">
                                {(stats?.tokensSold || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Tokens Used</span>
                            <span className="text-lg font-bold text-blue-600">
                                {(stats?.tokensUsed || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Remaining</span>
                                <span className="text-lg font-bold text-green-600">
                                    {((stats?.tokensSold || 0) - (stats?.tokensUsed || 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/admin/users"
                        className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <Users className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Manage Users</span>
                    </a>
                    <a
                        href="/admin/packages"
                        className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                        <Package className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-purple-900">Token Packages</span>
                    </a>
                    <a
                        href="/admin/features"
                        className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900">Feature Pricing</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
