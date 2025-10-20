/**
 * Admin Settings Page
 * Configure system settings
 */

'use client';

import { Settings, Bell, Key, Shield, Database } from 'lucide-react';

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="mt-2 text-gray-600">
                    Configure system settings and preferences
                </p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
                {/* API Keys */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Key className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">API Configuration</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                OpenAI API Key
                            </label>
                            <input
                                type="password"
                                value="sk-••••••••••••••••"
                                readOnly
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Configure in .env.local file
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Anthropic API Key
                            </label>
                            <input
                                type="password"
                                value="sk-ant-••••••••••••••••"
                                readOnly
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Configure in .env.local file
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Bell className="h-6 w-6 text-green-600" />
                        <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                    </div>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">New User Signups</div>
                                <div className="text-sm text-gray-500">Get notified when users sign up</div>
                            </div>
                            <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        </label>
                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">New Subscriptions</div>
                                <div className="text-sm text-gray-500">Get notified of new subscriptions</div>
                            </div>
                            <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        </label>
                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">Failed Payments</div>
                                <div className="text-sm text-gray-500">Get notified of payment failures</div>
                            </div>
                            <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                        </label>
                    </div>
                </div>

                {/* Security */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="h-6 w-6 text-red-600" />
                        <h2 className="text-xl font-bold text-gray-900">Security</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Emails
                            </label>
                            <input
                                type="text"
                                value="test@jobai.com, admin@jobai.com"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                placeholder="Comma-separated emails"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Users with these emails will have admin access
                            </p>
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Database className="h-6 w-6 text-purple-600" />
                        <h2 className="text-xl font-bold text-gray-900">System Information</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Environment</div>
                            <div className="font-semibold text-gray-900">Development</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Database</div>
                            <div className="font-semibold text-gray-900">Supabase</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Version</div>
                            <div className="font-semibold text-gray-900">1.0.0</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Framework</div>
                            <div className="font-semibold text-gray-900">Next.js 14</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
