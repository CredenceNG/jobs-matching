/**
 * Admin Feature Costs Management Page
 * Manage AI feature pricing and token costs
 */

'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Edit, Save, X, Plus, Trash2 } from 'lucide-react';

interface FeatureCost {
    id?: string;
    feature_key: string;
    feature_name: string;
    token_cost: number;
    description: string;
    category: string;
    active: boolean;
}

export default function AdminFeaturesPage() {
    const [features, setFeatures] = useState<FeatureCost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<FeatureCost | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        fetchFeatures();
    }, []);

    const fetchFeatures = async () => {
        try {
            const response = await fetch('/api/admin/features');
            if (response.ok) {
                const data = await response.json();
                setFeatures(data.features || []);
            }
        } catch (error) {
            console.error('Error fetching features:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (feature: FeatureCost) => {
        setEditingId(feature.id || feature.feature_key);
        setEditForm({ ...feature });
    };

    const handleSave = async () => {
        if (!editForm) return;

        try {
            const response = await fetch('/api/admin/features', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (response.ok) {
                await fetchFeatures();
                setEditingId(null);
                setEditForm(null);
            }
        } catch (error) {
            console.error('Error saving feature:', error);
        }
    };

    const handleAdd = async () => {
        if (!editForm) return;

        try {
            const response = await fetch('/api/admin/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (response.ok) {
                await fetchFeatures();
                setShowAddForm(false);
                setEditForm(null);
            }
        } catch (error) {
            console.error('Error adding feature:', error);
        }
    };

    const handleDelete = async (featureKey: string) => {
        if (!confirm('Are you sure you want to delete this feature?')) return;

        try {
            const response = await fetch(`/api/admin/features?key=${featureKey}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchFeatures();
            }
        } catch (error) {
            console.error('Error deleting feature:', error);
        }
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
                    <h1 className="text-3xl font-bold text-gray-900">Feature Costs</h1>
                    <p className="mt-2 text-gray-600">
                        Manage AI feature pricing and token costs
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(true);
                        setEditForm({
                            feature_key: '',
                            feature_name: '',
                            token_cost: 0,
                            description: '',
                            category: 'resume',
                            active: true,
                        });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Add Feature
                </button>
            </div>

            {/* Add Form Modal */}
            {showAddForm && editForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Feature</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Feature Key
                                </label>
                                <input
                                    type="text"
                                    value={editForm.feature_key}
                                    onChange={(e) => setEditForm({ ...editForm, feature_key: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., cover_letter_generation"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Feature Name
                                </label>
                                <input
                                    type="text"
                                    value={editForm.feature_name}
                                    onChange={(e) => setEditForm({ ...editForm, feature_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., AI Cover Letter Generation"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Token Cost
                                </label>
                                <input
                                    type="number"
                                    value={editForm.token_cost}
                                    onChange={(e) => setEditForm({ ...editForm, token_cost: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="job_search">Job Search</option>
                                    <option value="resume">Resume</option>
                                    <option value="application">Application</option>
                                    <option value="interview">Interview</option>
                                    <option value="career">Career</option>
                                    <option value="automation">Automation</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={editForm.active}
                                    onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                                    className="rounded border-gray-300"
                                />
                                <label className="text-sm font-medium text-gray-700">Active</label>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditForm(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Save className="h-4 w-4" />
                                Add Feature
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Features Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Feature
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Key
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cost
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {features.map((feature) => {
                                const isEditing = editingId === (feature.id || feature.feature_key);

                                return (
                                    <tr key={feature.id || feature.feature_key} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm?.feature_name}
                                                    onChange={(e) =>
                                                        setEditForm({ ...editForm!, feature_name: e.target.value })
                                                    }
                                                    className="w-full px-2 py-1 border border-gray-300 rounded"
                                                />
                                            ) : (
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {feature.feature_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{feature.description}</div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                                                {feature.feature_key}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={editForm?.token_cost}
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm!,
                                                            token_cost: parseInt(e.target.value),
                                                        })
                                                    }
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                />
                                            ) : (
                                                <span className="flex items-center gap-1 font-semibold text-gray-900">
                                                    <DollarSign className="h-4 w-4 text-gray-400" />
                                                    {feature.token_cost} tokens
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                {feature.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    feature.active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {feature.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={handleSave}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setEditForm(null);
                                                        }}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(feature)}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(feature.feature_key)}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
