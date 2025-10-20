/**
 * Admin Page: Location Management
 *
 * Allows admins to view, create, edit, and delete location configurations
 * for the dynamic location system
 */

'use client';

import { useEffect, useState } from 'react';
import { Globe, Plus, Edit2, Trash2, Search, MapPin } from 'lucide-react';

interface LocationConfig {
    id: string;
    country: string;
    region: string;
    keywords: string[];
    scrapers: string[];
    priority: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function LocationsManagement() {
    const [locations, setLocations] = useState<LocationConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<LocationConfig | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        country: '',
        region: '',
        keywords: '',
        scrapers: '',
        priority: 0,
        isActive: true
    });

    useEffect(() => {
        fetchLocations();
    }, [filterActive]);

    const fetchLocations = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (filterActive !== 'all') {
                params.append('isActive', filterActive === 'active' ? 'true' : 'false');
            }

            const response = await fetch(`/api/admin/locations?${params}`);
            if (response.ok) {
                const data = await response.json();
                setLocations(data.locations || []);
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            country: formData.country,
            region: formData.region,
            keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
            scrapers: formData.scrapers.split(',').map(s => s.trim()).filter(Boolean),
            priority: formData.priority,
            isActive: formData.isActive
        };

        try {
            const url = editingLocation
                ? `/api/admin/locations/${editingLocation.id}`
                : '/api/admin/locations';

            const method = editingLocation ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await fetchLocations();
                closeModal();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to save location'}`);
            }
        } catch (error) {
            console.error('Error saving location:', error);
            alert('Failed to save location');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this location?')) return;

        try {
            const response = await fetch(`/api/admin/locations/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchLocations();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to delete location'}`);
            }
        } catch (error) {
            console.error('Error deleting location:', error);
            alert('Failed to delete location');
        }
    };

    const openModal = (location?: LocationConfig) => {
        if (location) {
            setEditingLocation(location);
            setFormData({
                country: location.country,
                region: location.region,
                keywords: location.keywords.join(', '),
                scrapers: location.scrapers.join(', '),
                priority: location.priority,
                isActive: location.isActive
            });
        } else {
            setEditingLocation(null);
            setFormData({
                country: '',
                region: '',
                keywords: '',
                scrapers: '',
                priority: 0,
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingLocation(null);
        setFormData({
            country: '',
            region: '',
            keywords: '',
            scrapers: '',
            priority: 0,
            isActive: true
        });
    };

    const filteredLocations = locations.filter(location =>
        location.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.region.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Globe className="h-8 w-8 text-blue-600" />
                        Location Management
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Configure supported locations and their scraper settings
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Add Location
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterActive('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                filterActive === 'all'
                                    ? 'bg-blue-600 text-white'
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
            </div>

            {/* Locations Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : filteredLocations.length === 0 ? (
                    <div className="text-center py-20">
                        <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No locations found</p>
                        <button
                            onClick={() => openModal()}
                            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Add your first location
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Keywords
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Scrapers
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Priority
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
                                {filteredLocations.map((location) => (
                                    <tr key={location.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {location.country}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {location.region}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {location.keywords.slice(0, 3).map((keyword, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                                                    >
                                                        {keyword}
                                                    </span>
                                                ))}
                                                {location.keywords.length > 3 && (
                                                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                                        +{location.keywords.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {location.scrapers.map((scraper, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded"
                                                    >
                                                        {scraper}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900">
                                                {location.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    location.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {location.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => openModal(location)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(location.id)}
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
                                {editingLocation ? 'Edit Location' : 'Add New Location'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Country *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.country}
                                            onChange={(e) =>
                                                setFormData({ ...formData, country: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Canada"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Region *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.region}
                                            onChange={(e) =>
                                                setFormData({ ...formData, region: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., North America"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Keywords (comma-separated) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.keywords}
                                        onChange={(e) =>
                                            setFormData({ ...formData, keywords: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., canada, canadian, ca"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Scrapers (comma-separated) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.scrapers}
                                        onChange={(e) =>
                                            setFormData({ ...formData, scrapers: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., indeed, linkedin, glassdoor"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Priority
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.priority}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    priority: parseInt(e.target.value)
                                                })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0"
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
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                                Active
                                            </span>
                                        </label>
                                    </div>
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
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        {editingLocation ? 'Save Changes' : 'Add Location'}
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
