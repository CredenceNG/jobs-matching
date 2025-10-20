/**
 * Admin Page: Job Scraper Management
 *
 * Allows admins to view, create, edit, and manage job scraper configurations
 * and monitor their performance statistics
 */

'use client';

import { useEffect, useState } from 'react';
import { Search as SearchIcon, Plus, Edit2, Trash2, Activity, TrendingUp } from 'lucide-react';

interface ScraperStats {
    id: string;
    name: string;
    source: string;
    isActive: boolean;
    totalJobs: number;
    successfulScrapes: number;
    failedScrapes: number;
    lastScrapedAt: string | null;
    averageDuration: number;
    createdAt: string;
    updatedAt: string;
}

export default function ScrapersManagement() {
    const [scrapers, setScrapers] = useState<ScraperStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingScraper, setEditingScraper] = useState<ScraperStats | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        source: '',
        isActive: true
    });

    useEffect(() => {
        fetchScrapers();
    }, [filterActive]);

    const fetchScrapers = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (filterActive !== 'all') {
                params.append('isActive', filterActive === 'active' ? 'true' : 'false');
            }

            const response = await fetch(`/api/admin/scrapers?${params}`);
            if (response.ok) {
                const data = await response.json();
                setScrapers(data.scrapers || []);
            }
        } catch (error) {
            console.error('Error fetching scrapers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingScraper
                ? `/api/admin/scrapers/${editingScraper.id}`
                : '/api/admin/scrapers';

            const method = editingScraper ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await fetchScrapers();
                closeModal();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to save scraper'}`);
            }
        } catch (error) {
            console.error('Error saving scraper:', error);
            alert('Failed to save scraper');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this scraper?')) return;

        try {
            const response = await fetch(`/api/admin/scrapers/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchScrapers();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to delete scraper'}`);
            }
        } catch (error) {
            console.error('Error deleting scraper:', error);
            alert('Failed to delete scraper');
        }
    };

    const openModal = (scraper?: ScraperStats) => {
        if (scraper) {
            setEditingScraper(scraper);
            setFormData({
                name: scraper.name,
                source: scraper.source,
                isActive: scraper.isActive
            });
        } else {
            setEditingScraper(null);
            setFormData({
                name: '',
                source: '',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingScraper(null);
        setFormData({
            name: '',
            source: '',
            isActive: true
        });
    };

    const calculateSuccessRate = (scraper: ScraperStats) => {
        const total = scraper.successfulScrapes + scraper.failedScrapes;
        if (total === 0) return '0';
        return ((scraper.successfulScrapes / total) * 100).toFixed(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <SearchIcon className="h-8 w-8 text-purple-600" />
                        Job Scraper Management
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Monitor and configure job board scrapers
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Add Scraper
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Scrapers</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {scrapers.length}
                            </p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Scrapers</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {scrapers.filter(s => s.isActive).length}
                            </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Jobs Scraped</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">
                                {scrapers.reduce((sum, s) => sum + s.totalJobs, 0).toLocaleString()}
                            </p>
                        </div>
                        <SearchIcon className="h-8 w-8 text-purple-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Avg Success Rate</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                                {scrapers.length > 0
                                    ? (
                                          scrapers.reduce((sum, s) => sum + parseFloat(calculateSuccessRate(s)), 0) /
                                          scrapers.length
                                      ).toFixed(1)
                                    : '0'}
                                %
                            </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterActive('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filterActive === 'all'
                                ? 'bg-purple-600 text-white'
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
            </div>

            {/* Scrapers Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full" />
                    </div>
                ) : scrapers.length === 0 ? (
                    <div className="text-center py-20">
                        <SearchIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No scrapers found</p>
                        <button
                            onClick={() => openModal()}
                            className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                        >
                            Add your first scraper
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
                                        Source
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Jobs Scraped
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Success Rate
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Avg Duration
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
                                {scrapers.map((scraper) => (
                                    <tr key={scraper.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{scraper.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded">
                                                {scraper.source}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900">
                                                {scraper.totalJobs.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full"
                                                        style={{ width: `${calculateSuccessRate(scraper)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-900">
                                                    {calculateSuccessRate(scraper)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900">
                                                {scraper.averageDuration > 0
                                                    ? `${(scraper.averageDuration / 1000).toFixed(1)}s`
                                                    : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    scraper.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {scraper.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => openModal(scraper)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(scraper.id)}
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
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingScraper ? 'Edit Scraper' : 'Add New Scraper'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="e.g., Indeed Scraper"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Source *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.source}
                                        onChange={(e) =>
                                            setFormData({ ...formData, source: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="e.g., indeed"
                                    />
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
                                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
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
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        {editingScraper ? 'Save Changes' : 'Add Scraper'}
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
