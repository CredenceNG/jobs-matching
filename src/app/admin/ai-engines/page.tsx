/**
 * Admin Page: AI Engine Management
 *
 * Allows admins to view, create, edit, and manage AI engine configurations
 * for different providers (OpenAI, Anthropic, etc.)
 */

'use client';

import { useEffect, useState } from 'react';
import { Brain, Plus, Edit2, Trash2, Zap, DollarSign } from 'lucide-react';

interface AIEngine {
    id: string;
    name: string;
    provider: string;
    model: string;
    apiKey: string | null;
    baseUrl: string | null;
    maxTokens: number;
    temperature: number;
    costPer1kTokensInput: number;
    costPer1kTokensOutput: number;
    isActive: boolean;
    config: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export default function AIEnginesManagement() {
    const [engines, setEngines] = useState<AIEngine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterProvider, setFilterProvider] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEngine, setEditingEngine] = useState<AIEngine | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        provider: '',
        model: '',
        apiKey: '',
        baseUrl: '',
        maxTokens: 4096,
        temperature: 0.7,
        costPer1kTokensInput: 0,
        costPer1kTokensOutput: 0,
        isActive: true
    });

    useEffect(() => {
        fetchEngines();
    }, [filterActive, filterProvider]);

    const fetchEngines = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (filterActive !== 'all') {
                params.append('isActive', filterActive === 'active' ? 'true' : 'false');
            }
            if (filterProvider !== 'all') {
                params.append('provider', filterProvider);
            }

            const response = await fetch(`/api/admin/ai-engines?${params}`);
            if (response.ok) {
                const data = await response.json();
                setEngines(data.engines || []);
            }
        } catch (error) {
            console.error('Error fetching AI engines:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            apiKey: formData.apiKey || null,
            baseUrl: formData.baseUrl || null
        };

        try {
            const url = editingEngine
                ? `/api/admin/ai-engines/${editingEngine.id}`
                : '/api/admin/ai-engines';

            const method = editingEngine ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await fetchEngines();
                closeModal();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to save AI engine'}`);
            }
        } catch (error) {
            console.error('Error saving AI engine:', error);
            alert('Failed to save AI engine');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this AI engine?')) return;

        try {
            const response = await fetch(`/api/admin/ai-engines/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchEngines();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to delete AI engine'}`);
            }
        } catch (error) {
            console.error('Error deleting AI engine:', error);
            alert('Failed to delete AI engine');
        }
    };

    const openModal = (engine?: AIEngine) => {
        if (engine) {
            setEditingEngine(engine);
            setFormData({
                name: engine.name,
                provider: engine.provider,
                model: engine.model,
                apiKey: engine.apiKey || '',
                baseUrl: engine.baseUrl || '',
                maxTokens: engine.maxTokens,
                temperature: engine.temperature,
                costPer1kTokensInput: engine.costPer1kTokensInput,
                costPer1kTokensOutput: engine.costPer1kTokensOutput,
                isActive: engine.isActive
            });
        } else {
            setEditingEngine(null);
            setFormData({
                name: '',
                provider: '',
                model: '',
                apiKey: '',
                baseUrl: '',
                maxTokens: 4096,
                temperature: 0.7,
                costPer1kTokensInput: 0,
                costPer1kTokensOutput: 0,
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEngine(null);
    };

    const uniqueProviders = Array.from(new Set(engines.map(e => e.provider)));

    const getProviderColor = (provider: string) => {
        const colors: Record<string, string> = {
            openai: 'bg-green-100 text-green-800',
            anthropic: 'bg-orange-100 text-orange-800',
            google: 'bg-blue-100 text-blue-800',
            cohere: 'bg-purple-100 text-purple-800'
        };
        return colors[provider.toLowerCase()] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Brain className="h-8 w-8 text-indigo-600" />
                        AI Engine Management
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Configure AI model providers and their settings
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Add AI Engine
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Engines</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {engines.length}
                            </p>
                        </div>
                        <Brain className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Engines</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {engines.filter(e => e.isActive).length}
                            </p>
                        </div>
                        <Zap className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Providers</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">
                                {uniqueProviders.length}
                            </p>
                        </div>
                        <Brain className="h-8 w-8 text-purple-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Avg Cost (1K tokens)</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">
                                ${engines.length > 0
                                    ? (engines.reduce((sum, e) => sum + e.costPer1kTokensInput, 0) / engines.length).toFixed(4)
                                    : '0.0000'}
                            </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-orange-600" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterActive('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                filterActive === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterActive('active')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                filterActive === 'active'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilterActive('inactive')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                filterActive === 'inactive'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Inactive
                        </button>
                    </div>

                    {uniqueProviders.length > 0 && (
                        <select
                            value={filterProvider}
                            onChange={(e) => setFilterProvider(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="all">All Providers</option>
                            {uniqueProviders.map(provider => (
                                <option key={provider} value={provider}>
                                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Engines Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
                    </div>
                ) : engines.length === 0 ? (
                    <div className="text-center py-20">
                        <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No AI engines found</p>
                        <button
                            onClick={() => openModal()}
                            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Add your first AI engine
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Provider
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Model
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Config
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cost (Input/Output)
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
                                {engines.map((engine) => (
                                    <tr key={engine.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Brain className="h-4 w-4 text-gray-400" />
                                                <div className="font-medium text-gray-900">
                                                    {engine.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${getProviderColor(engine.provider)}`}>
                                                {engine.provider}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900 font-mono">
                                                {engine.model}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs text-gray-600">
                                                <div>Tokens: {engine.maxTokens}</div>
                                                <div>Temp: {engine.temperature}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs text-gray-900">
                                                <div>${engine.costPer1kTokensInput.toFixed(4)}</div>
                                                <div className="text-gray-500">
                                                    ${engine.costPer1kTokensOutput.toFixed(4)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    engine.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {engine.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => openModal(engine)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(engine.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingEngine ? 'Edit AI Engine' : 'Add New AI Engine'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="e.g., GPT-4o Mini"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Provider *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.provider}
                                            onChange={(e) =>
                                                setFormData({ ...formData, provider: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="e.g., openai, anthropic"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Model *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.model}
                                        onChange={(e) =>
                                            setFormData({ ...formData, model: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="e.g., gpt-4o-mini"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        API Key (optional)
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.apiKey}
                                        onChange={(e) =>
                                            setFormData({ ...formData, apiKey: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="sk-..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Base URL (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.baseUrl}
                                        onChange={(e) =>
                                            setFormData({ ...formData, baseUrl: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="https://api.openai.com/v1"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max Tokens
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.maxTokens}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    maxTokens: parseInt(e.target.value)
                                                })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Temperature
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="2"
                                            value={formData.temperature}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    temperature: parseFloat(e.target.value)
                                                })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Cost per 1K Input Tokens ($)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={formData.costPer1kTokensInput}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    costPer1kTokensInput: parseFloat(e.target.value)
                                                })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Cost per 1K Output Tokens ($)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={formData.costPer1kTokensOutput}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    costPer1kTokensOutput: parseFloat(e.target.value)
                                                })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    isActive: e.target.checked
                                                })
                                            }
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Active</span>
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        {editingEngine ? 'Save Changes' : 'Add Engine'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
