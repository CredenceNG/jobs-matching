/**
 * Admin Token Packages Management Page
 * Manage token packages, pricing, and discounts
 */

'use client';

import { useEffect, useState } from 'react';
import { Package, Edit, Save, X, Plus, Trash2, DollarSign, Star, TrendingUp } from 'lucide-react';

interface TokenPackage {
    id: string;
    tier: string;
    name: string;
    tokens: number;
    price_cents: number;
    discount_percentage: number;
    popular: boolean;
    best_value: boolean;
    active: boolean;
    sort_order: number;
}

export default function AdminPackagesPage() {
    const [packages, setPackages] = useState<TokenPackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<TokenPackage | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await fetch('/api/admin/packages');
            if (response.ok) {
                const data = await response.json();
                setPackages(data.packages || []);
            }
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (pkg: TokenPackage) => {
        setEditingId(pkg.id);
        setEditForm({ ...pkg });
    };

    const handleSave = async () => {
        if (!editForm) return;

        try {
            const response = await fetch('/api/admin/packages', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (response.ok) {
                await fetchPackages();
                setEditingId(null);
                setEditForm(null);
            }
        } catch (error) {
            console.error('Error saving package:', error);
        }
    };

    const handleAdd = async () => {
        if (!editForm) return;

        try {
            const response = await fetch('/api/admin/packages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (response.ok) {
                await fetchPackages();
                setShowAddForm(false);
                setEditForm(null);
            }
        } catch (error) {
            console.error('Error adding package:', error);
        }
    };

    const handleDelete = async (packageId: string) => {
        if (!confirm('Are you sure you want to delete this package?')) return;

        try {
            const response = await fetch(`/api/admin/packages?id=${packageId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchPackages();
            }
        } catch (error) {
            console.error('Error deleting package:', error);
        }
    };

    const calculatePricePerToken = (priceCents: number, tokens: number) => {
        return (priceCents / tokens / 100).toFixed(4);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Token Packages</h1>
                    <p className="mt-2 text-gray-600">
                        Manage token packages, pricing, and discounts
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(true);
                        setEditForm({
                            id: '',
                            tier: 'basic',
                            name: 'New Package',
                            tokens: 100,
                            price_cents: 1000,
                            discount_percentage: 0,
                            popular: false,
                            best_value: false,
                            active: true,
                            sort_order: packages.length + 1,
                        });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Add Package
                </button>
            </div>

            {/* Add/Edit Form Modal */}
            {(showAddForm && editForm) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            {editingId ? 'Edit Package' : 'Add New Package'}
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Package Name
                                </label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Basic Package"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tier
                                </label>
                                <select
                                    value={editForm.tier}
                                    onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="basic">Basic</option>
                                    <option value="pro">Pro</option>
                                    <option value="premium">Premium</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tokens
                                </label>
                                <input
                                    type="number"
                                    value={editForm.tokens}
                                    onChange={(e) => setEditForm({ ...editForm, tokens: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price (cents)
                                </label>
                                <input
                                    type="number"
                                    value={editForm.price_cents}
                                    onChange={(e) => setEditForm({ ...editForm, price_cents: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    ${(editForm.price_cents / 100).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discount %
                                </label>
                                <input
                                    type="number"
                                    value={editForm.discount_percentage}
                                    onChange={(e) => setEditForm({ ...editForm, discount_percentage: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    value={editForm.sort_order}
                                    onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editForm.popular}
                                        onChange={(e) => setEditForm({ ...editForm, popular: e.target.checked })}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Mark as Popular</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editForm.best_value}
                                        onChange={(e) => setEditForm({ ...editForm, best_value: e.target.checked })}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Mark as Best Value</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editForm.active}
                                        onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Active</span>
                                </label>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditForm(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Save className="h-4 w-4" />
                                {editingId ? 'Save Changes' : 'Add Package'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                    <div
                        key={pkg.id}
                        className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-all ${
                            pkg.popular ? 'border-blue-500' : 'border-gray-200'
                        }`}
                    >
                        {/* Badges */}
                        <div className="flex gap-2 mb-4">
                            {pkg.popular && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                    <Star className="h-3 w-3" />
                                    Popular
                                </span>
                            )}
                            {pkg.best_value && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                    <TrendingUp className="h-3 w-3" />
                                    Best Value
                                </span>
                            )}
                            {!pkg.active && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                    Inactive
                                </span>
                            )}
                        </div>

                        {/* Package Info */}
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                            <p className="text-sm text-gray-500 capitalize">{pkg.tier} Tier</p>
                        </div>

                        {/* Pricing */}
                        <div className="mb-4 pb-4 border-b border-gray-200">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-gray-900">
                                    ${(pkg.price_cents / 100).toFixed(2)}
                                </span>
                                {pkg.discount_percentage > 0 && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                        {pkg.discount_percentage}% OFF
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{pkg.tokens.toLocaleString()} tokens</p>
                            <p className="text-xs text-gray-400 mt-1">
                                ${calculatePricePerToken(pkg.price_cents, pkg.tokens)} per token
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <button
                                onClick={() => handleEdit(pkg)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Edit className="h-4 w-4" />
                                Edit Package
                            </button>
                            <button
                                onClick={() => handleDelete(pkg.id)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {packages.length === 0 && (
                <div className="text-center py-20">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No packages found</p>
                    <p className="text-gray-400 text-sm mt-2">Create your first token package to get started</p>
                </div>
            )}
        </div>
    );
}
