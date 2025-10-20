/**
 * Admin Page: Scrape Schedule Management
 *
 * Allows admins to view, create, edit, and manage automated scraping schedules
 * with cron expressions for different job sources
 */

'use client';

import { useEffect, useState } from 'react';
import { Clock, Plus, Edit2, Trash2, Calendar, PlayCircle } from 'lucide-react';

interface ScrapeSchedule {
    id: string;
    name: string;
    cronExpression: string;
    sources: string[];
    locations: string[];
    keywords: string[];
    isActive: boolean;
    lastRunAt: string | null;
    nextRunAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function ScheduleManagement() {
    const [schedules, setSchedules] = useState<ScrapeSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<ScrapeSchedule | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        cronExpression: '',
        sources: '',
        locations: '',
        keywords: '',
        isActive: true
    });

    useEffect(() => {
        fetchSchedules();
    }, [filterActive]);

    const fetchSchedules = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (filterActive !== 'all') {
                params.append('isActive', filterActive === 'active' ? 'true' : 'false');
            }

            const response = await fetch(`/api/admin/schedule?${params}`);
            if (response.ok) {
                const data = await response.json();
                setSchedules(data.schedules || []);
            }
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name: formData.name,
            cronExpression: formData.cronExpression,
            sources: formData.sources.split(',').map(s => s.trim()).filter(Boolean),
            locations: formData.locations.split(',').map(l => l.trim()).filter(Boolean),
            keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
            isActive: formData.isActive
        };

        try {
            const url = editingSchedule
                ? `/api/admin/schedule/${editingSchedule.id}`
                : '/api/admin/schedule';

            const method = editingSchedule ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await fetchSchedules();
                closeModal();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to save schedule'}`);
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Failed to save schedule');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;

        try {
            const response = await fetch(`/api/admin/schedule/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchSchedules();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to delete schedule'}`);
            }
        } catch (error) {
            console.error('Error deleting schedule:', error);
            alert('Failed to delete schedule');
        }
    };

    const openModal = (schedule?: ScrapeSchedule) => {
        if (schedule) {
            setEditingSchedule(schedule);
            setFormData({
                name: schedule.name,
                cronExpression: schedule.cronExpression,
                sources: schedule.sources.join(', '),
                locations: schedule.locations.join(', '),
                keywords: schedule.keywords.join(', '),
                isActive: schedule.isActive
            });
        } else {
            setEditingSchedule(null);
            setFormData({
                name: '',
                cronExpression: '',
                sources: '',
                locations: '',
                keywords: '',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSchedule(null);
        setFormData({
            name: '',
            cronExpression: '',
            sources: '',
            locations: '',
            keywords: '',
            isActive: true
        });
    };

    const formatCronDescription = (cron: string) => {
        // Simple cron descriptions
        const descriptions: Record<string, string> = {
            '0 */6 * * *': 'Every 6 hours',
            '0 */12 * * *': 'Every 12 hours',
            '0 0 * * *': 'Daily at midnight',
            '0 */1 * * *': 'Every hour',
            '*/30 * * * *': 'Every 30 minutes',
            '0 8 * * *': 'Daily at 8 AM',
        };
        return descriptions[cron] || cron;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Clock className="h-8 w-8 text-orange-600" />
                        Scrape Schedule Management
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Configure automated job scraping schedules
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Add Schedule
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Schedules</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {schedules.length}
                            </p>
                        </div>
                        <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Schedules</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {schedules.filter(s => s.isActive).length}
                            </p>
                        </div>
                        <PlayCircle className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Inactive Schedules</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">
                                {schedules.filter(s => !s.isActive).length}
                            </p>
                        </div>
                        <Clock className="h-8 w-8 text-red-600" />
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
                                ? 'bg-orange-600 text-white'
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

            {/* Schedules Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin h-12 w-12 border-4 border-orange-600 border-t-transparent rounded-full" />
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="text-center py-20">
                        <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No schedules found</p>
                        <button
                            onClick={() => openModal()}
                            className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
                        >
                            Add your first schedule
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
                                        Frequency
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sources
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Locations
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
                                {schedules.map((schedule) => (
                                    <tr key={schedule.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                <div className="font-medium text-gray-900">
                                                    {schedule.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatCronDescription(schedule.cronExpression)}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono">
                                                {schedule.cronExpression}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {schedule.sources.slice(0, 2).map((source, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded"
                                                    >
                                                        {source}
                                                    </span>
                                                ))}
                                                {schedule.sources.length > 2 && (
                                                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                                        +{schedule.sources.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {schedule.locations.length > 0 ? (
                                                    <>
                                                        {schedule.locations.slice(0, 2).map((location, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                                                            >
                                                                {location}
                                                            </span>
                                                        ))}
                                                        {schedule.locations.length > 2 && (
                                                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                                                +{schedule.locations.length - 2}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-gray-400">All</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    schedule.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {schedule.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => openModal(schedule)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(schedule.id)}
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
                                {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Schedule Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="e.g., Daily Job Scrape"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cron Expression *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.cronExpression}
                                        onChange={(e) =>
                                            setFormData({ ...formData, cronExpression: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                                        placeholder="e.g., 0 */6 * * *"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Examples: "0 */6 * * *" (every 6 hours), "0 0 * * *" (daily at midnight)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sources (comma-separated) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.sources}
                                        onChange={(e) =>
                                            setFormData({ ...formData, sources: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="e.g., indeed, linkedin, glassdoor"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Locations (comma-separated, optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.locations}
                                        onChange={(e) =>
                                            setFormData({ ...formData, locations: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="e.g., USA, Canada, UK"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Keywords (comma-separated, optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.keywords}
                                        onChange={(e) =>
                                            setFormData({ ...formData, keywords: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="e.g., software engineer, developer"
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
                                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            Active
                                        </span>
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
                                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                    >
                                        {editingSchedule ? 'Save Changes' : 'Add Schedule'}
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
