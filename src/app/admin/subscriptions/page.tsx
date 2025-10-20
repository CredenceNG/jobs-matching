/**
 * Admin Subscriptions Management Page
 * View and manage all subscriptions
 */

'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Search, Calendar, DollarSign, X, CheckCircle, AlertCircle } from 'lucide-react';

interface Subscription {
    id: string;
    user_id: string;
    user_email: string;
    user_name?: string;
    plan: string;
    status: string;
    stripe_subscription_id: string;
    current_period_start: string;
    current_period_end: string;
    created_at: string;
}

export default function AdminSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'canceled' | 'past_due'>('all');

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const response = await fetch('/api/admin/subscriptions');
            if (response.ok) {
                const data = await response.json();
                setSubscriptions(data.subscriptions || []);
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelSubscription = async (subscriptionId: string) => {
        if (!confirm('Are you sure you want to cancel this subscription?')) return;

        try {
            const response = await fetch('/api/admin/subscriptions/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId }),
            });

            if (response.ok) {
                alert('Subscription canceled successfully');
                fetchSubscriptions();
            }
        } catch (error) {
            console.error('Error canceling subscription:', error);
            alert('Failed to cancel subscription');
        }
    };

    const filteredSubscriptions = subscriptions.filter((sub) => {
        const matchesSearch =
            sub.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.user_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter =
            filterStatus === 'all' || sub.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
            active: { icon: CheckCircle, color: 'green', label: 'Active' },
            canceled: { icon: X, color: 'red', label: 'Canceled' },
            past_due: { icon: AlertCircle, color: 'yellow', label: 'Past Due' },
            trialing: { icon: CreditCard, color: 'blue', label: 'Trialing' },
        };

        const config = statusConfig[status] || statusConfig.active;
        const Icon = config.icon;

        return (
            <span className={`flex items-center gap-1 px-3 py-1 bg-${config.color}-100 text-${config.color}-700 rounded-full text-xs font-medium w-fit`}>
                <Icon className="h-3 w-3" />
                {config.label}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    const stats = {
        total: subscriptions.length,
        active: subscriptions.filter((s) => s.status === 'active').length,
        canceled: subscriptions.filter((s) => s.status === 'canceled').length,
        monthly: subscriptions.filter((s) => s.plan === 'monthly' && s.status === 'active').length,
        annual: subscriptions.filter((s) => s.plan === 'annual' && s.status === 'active').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
                <p className="mt-2 text-gray-600">
                    View and manage all subscriptions
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <CreditCard className="h-10 w-10 text-gray-600" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active</p>
                            <p className="mt-2 text-3xl font-bold text-green-600">{stats.active}</p>
                        </div>
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Monthly</p>
                            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.monthly}</p>
                        </div>
                        <Calendar className="h-10 w-10 text-blue-600" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Annual</p>
                            <p className="mt-2 text-3xl font-bold text-purple-600">{stats.annual}</p>
                        </div>
                        <DollarSign className="h-10 w-10 text-purple-600" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by email or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="canceled">Canceled Only</option>
                            <option value="past_due">Past Due Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Plan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Period
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredSubscriptions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {sub.user_name || 'Unnamed User'}
                                            </div>
                                            <div className="text-sm text-gray-500">{sub.user_email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                                            {sub.plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(sub.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {new Date(sub.current_period_start).toLocaleDateString()} -{' '}
                                            {new Date(sub.current_period_end).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Joined {new Date(sub.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {sub.status === 'active' && (
                                            <button
                                                onClick={() => handleCancelSubscription(sub.id)}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                            >
                                                <X className="h-4 w-4" />
                                                Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredSubscriptions.length === 0 && (
                    <div className="text-center py-12">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No subscriptions found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
