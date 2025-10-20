/**
 * Career Insights Dashboard Component
 * 
 * Comprehensive dashboard for career analytics and insights.
 * Provides salary analysis, market trends, skills gap analysis, and career recommendations.
 * 
 * @description Career analytics, salary insights, market trends, and career path recommendations
 */

'use client';

import { useState, useEffect } from 'react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface SalaryData {
    role: string;
    location: string;
    experience: string;
    salaryRange: {
        min: number;
        max: number;
        median: number;
        currency: string;
    };
    marketTrend: 'up' | 'down' | 'stable';
    dataPoints: number;
    lastUpdated: string;
}

interface MarketTrends {
    industry: string;
    jobGrowth: number;
    demandScore: number;
    competitiveness: 'low' | 'medium' | 'high';
    topSkills: Array<{
        skill: string;
        demand: number;
        growth: number;
    }>;
    emergingRoles: Array<{
        title: string;
        growth: number;
        avgSalary: number;
    }>;
}

interface SkillsGap {
    currentSkills: string[];
    targetRole: string;
    missingSkills: Array<{
        skill: string;
        importance: 'critical' | 'important' | 'nice-to-have';
        timeToLearn: string;
        resources: Array<{
            type: 'course' | 'book' | 'certification' | 'project';
            name: string;
            url?: string;
            difficulty: 'beginner' | 'intermediate' | 'advanced';
        }>;
    }>;
    strengths: Array<{
        skill: string;
        proficiency: number;
        marketValue: number;
    }>;
}

interface CareerPath {
    currentRole: string;
    targetRole: string;
    pathway: Array<{
        step: number;
        role: string;
        timeframe: string;
        requirements: string[];
        salaryRange: { min: number; max: number };
        description: string;
    }>;
    alternativePaths: Array<{
        name: string;
        description: string;
        difficulty: 'easy' | 'medium' | 'hard';
        timeframe: string;
    }>;
}

interface LocationInsights {
    city: string;
    country: string;
    jobMarket: {
        totalJobs: number;
        growth: number;
        competitiveness: number;
    };
    costOfLiving: {
        index: number;
        housing: number;
        transportation: number;
    };
    salaryAdjustment: number;
    topCompanies: Array<{
        name: string;
        openings: number;
        avgSalary: number;
    }>;
}

interface CareerInsightsDashboardProps {
    userProfile?: {
        role?: string;
        experience?: string;
        skills?: string[];
        location?: string;
        targetRole?: string;
    };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CareerInsightsDashboard({ userProfile }: CareerInsightsDashboardProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'salary' | 'trends' | 'skills' | 'career' | 'location'>('overview');
    const [salaryData, setSalaryData] = useState<SalaryData | null>(null);
    const [marketTrends, setMarketTrends] = useState<MarketTrends | null>(null);
    const [skillsGap, setSkillsGap] = useState<SkillsGap | null>(null);
    const [careerPath, setCareerPath] = useState<CareerPath | null>(null);
    const [locationInsights, setLocationInsights] = useState<LocationInsights | null>(null);
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const [error, setError] = useState<string | null>(null);

    // Search parameters
    const [searchParams, setSearchParams] = useState({
        role: userProfile?.role || '',
        location: userProfile?.location || '',
        experience: userProfile?.experience || 'mid-level',
        targetRole: userProfile?.targetRole || '',
    });

    useEffect(() => {
        if (userProfile) {
            setSearchParams(prev => ({
                ...prev,
                role: userProfile.role || prev.role,
                location: userProfile.location || prev.location,
                experience: userProfile.experience || prev.experience,
                targetRole: userProfile.targetRole || prev.targetRole,
            }));
        }
    }, [userProfile]);

    const fetchSalaryData = async () => {
        if (!searchParams.role) return;

        setLoading(prev => ({ ...prev, salary: true }));
        setError(null);

        try {
            const response = await fetch('/api/ai/salary-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: searchParams.role,
                    location: searchParams.location,
                    experience: searchParams.experience,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch salary data');
            }

            const data = await response.json();
            setSalaryData(data);
        } catch (err) {
            console.error('Salary data error:', err);
            setError('Failed to load salary insights');
        } finally {
            setLoading(prev => ({ ...prev, salary: false }));
        }
    };

    const fetchMarketTrends = async () => {
        setLoading(prev => ({ ...prev, trends: true }));
        setError(null);

        try {
            const response = await fetch('/api/ai/market-trends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    industry: 'technology', // Could be dynamic
                    role: searchParams.role,
                    location: searchParams.location,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch market trends');
            }

            const data = await response.json();
            setMarketTrends(data);
        } catch (err) {
            console.error('Market trends error:', err);
            setError('Failed to load market trends');
        } finally {
            setLoading(prev => ({ ...prev, trends: false }));
        }
    };

    const fetchSkillsGap = async () => {
        if (!userProfile?.skills || !searchParams.targetRole) return;

        setLoading(prev => ({ ...prev, skills: true }));
        setError(null);

        try {
            const response = await fetch('/api/ai/skills-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentSkills: userProfile.skills,
                    targetRole: searchParams.targetRole,
                    currentRole: searchParams.role,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch skills analysis');
            }

            const data = await response.json();
            setSkillsGap(data);
        } catch (err) {
            console.error('Skills gap error:', err);
            setError('Failed to load skills analysis');
        } finally {
            setLoading(prev => ({ ...prev, skills: false }));
        }
    };

    const formatCurrency = (amount: number, currency = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const getGrowthIcon = (growth: number): string => {
        if (growth > 5) return '📈';
        if (growth < -5) return '📉';
        return '📊';
    };

    const getCompetitivenessColor = (level: 'low' | 'medium' | 'high'): string => {
        switch (level) {
            case 'low': return 'text-green-600 bg-green-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'high': return 'text-red-600 bg-red-100';
        }
    };

    // Overview Tab
    const OverviewTab = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Career Insights Overview</h3>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">$125K</div>
                        <div className="text-sm text-blue-800">Median Salary</div>
                        <div className="text-xs text-blue-600 mt-1">+8% YoY</div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">92%</div>
                        <div className="text-sm text-green-800">Market Demand</div>
                        <div className="text-xs text-green-600 mt-1">High demand</div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-600">15%</div>
                        <div className="text-sm text-purple-800">Job Growth</div>
                        <div className="text-xs text-purple-600 mt-1">Above average</div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-orange-600">3.2K</div>
                        <div className="text-sm text-orange-800">Open Positions</div>
                        <div className="text-xs text-orange-600 mt-1">In your area</div>
                    </div>
                </div>

                {/* Search Parameters */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Search Parameters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <input
                                type="text"
                                value={searchParams.role}
                                onChange={(e) => setSearchParams(prev => ({ ...prev, role: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="e.g., Software Engineer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                value={searchParams.location}
                                onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="e.g., San Francisco, CA"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                            <select
                                value={searchParams.experience}
                                onChange={(e) => setSearchParams(prev => ({ ...prev, experience: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                                <option value="entry-level">Entry Level (0-2 years)</option>
                                <option value="mid-level">Mid Level (3-5 years)</option>
                                <option value="senior">Senior (6-10 years)</option>
                                <option value="lead">Lead (10+ years)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Role</label>
                            <input
                                type="text"
                                value={searchParams.targetRole}
                                onChange={(e) => setSearchParams(prev => ({ ...prev, targetRole: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="e.g., Senior Software Engineer"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <button
                            onClick={() => {
                                fetchSalaryData();
                                fetchMarketTrends();
                                fetchSkillsGap();
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                        >
                            🔍 Update Insights
                        </button>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setActiveTab('salary')}
                        className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                        <div className="text-2xl mb-2">💰</div>
                        <h4 className="font-medium text-gray-900">Salary Analysis</h4>
                        <p className="text-sm text-gray-600 mt-1">
                            Detailed salary insights and benchmarks
                        </p>
                    </button>

                    <button
                        onClick={() => setActiveTab('trends')}
                        className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                        <div className="text-2xl mb-2">📈</div>
                        <h4 className="font-medium text-gray-900">Market Trends</h4>
                        <p className="text-sm text-gray-600 mt-1">
                            Industry growth and emerging opportunities
                        </p>
                    </button>

                    <button
                        onClick={() => setActiveTab('skills')}
                        className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                        <div className="text-2xl mb-2">🎯</div>
                        <h4 className="font-medium text-gray-900">Skills Gap</h4>
                        <p className="text-sm text-gray-600 mt-1">
                            Identify missing skills and learning paths
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );

    // Salary Tab
    const SalaryTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Salary Analysis</h3>
                <button
                    onClick={fetchSalaryData}
                    disabled={loading.salary}
                    className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                >
                    {loading.salary ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
            </div>

            {salaryData ? (
                <div className="space-y-6">
                    {/* Main Salary Info */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                {formatCurrency(salaryData.salaryRange.median)}
                            </div>
                            <p className="text-gray-600 mb-4">Median Salary</p>
                            <div className="text-sm text-gray-500">
                                Range: {formatCurrency(salaryData.salaryRange.min)} - {formatCurrency(salaryData.salaryRange.max)}
                            </div>
                            <div className="flex items-center justify-center mt-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${salaryData.marketTrend === 'up' ? 'bg-green-100 text-green-800' :
                                        salaryData.marketTrend === 'down' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {salaryData.marketTrend === 'up' ? '📈 Trending Up' :
                                        salaryData.marketTrend === 'down' ? '📉 Trending Down' :
                                            '📊 Stable'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Salary Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">25th Percentile</h4>
                            <div className="text-2xl font-bold text-gray-600">
                                {formatCurrency(salaryData.salaryRange.min)}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Entry-level range</p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">50th Percentile</h4>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(salaryData.salaryRange.median)}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Market average</p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">75th Percentile</h4>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(salaryData.salaryRange.max)}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Top performer range</p>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Data Points:</span>
                                <span className="ml-2 font-medium">{salaryData.dataPoints.toLocaleString()} salaries</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Last Updated:</span>
                                <span className="ml-2 font-medium">{new Date(salaryData.lastUpdated).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">💰</div>
                    <h4 className="font-medium text-gray-900 mb-2">No Salary Data Available</h4>
                    <p className="text-gray-600 mb-4">Enter a role and location to get salary insights</p>
                    <button
                        onClick={fetchSalaryData}
                        disabled={!searchParams.role || loading.salary}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        Get Salary Data
                    </button>
                </div>
            )}
        </div>
    );

    // Market Trends Tab
    const TrendsTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Market Trends</h3>
                <button
                    onClick={fetchMarketTrends}
                    disabled={loading.trends}
                    className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                >
                    {loading.trends ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
            </div>

            {marketTrends ? (
                <div className="space-y-6">
                    {/* Industry Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-green-600 mb-1">
                                {marketTrends.jobGrowth > 0 ? '+' : ''}{marketTrends.jobGrowth}%
                            </div>
                            <div className="text-sm text-green-800">Job Growth</div>
                            <div className="text-xs text-green-600 mt-1">Year over year</div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-blue-600 mb-1">
                                {marketTrends.demandScore}/100
                            </div>
                            <div className="text-sm text-blue-800">Demand Score</div>
                            <div className="text-xs text-blue-600 mt-1">Market demand</div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className={`text-2xl font-bold mb-1 ${marketTrends.competitiveness === 'low' ? 'text-green-600' :
                                    marketTrends.competitiveness === 'medium' ? 'text-yellow-600' :
                                        'text-red-600'
                                }`}>
                                {marketTrends.competitiveness}
                            </div>
                            <div className={`text-sm ${marketTrends.competitiveness === 'low' ? 'text-green-800' :
                                    marketTrends.competitiveness === 'medium' ? 'text-yellow-800' :
                                        'text-red-800'
                                }`}>Competition</div>
                            <div className={`text-xs mt-1 ${marketTrends.competitiveness === 'low' ? 'text-green-600' :
                                    marketTrends.competitiveness === 'medium' ? 'text-yellow-600' :
                                        'text-red-600'
                                }`}>Market competition</div>
                        </div>
                    </div>

                    {/* Top Skills */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">In-Demand Skills</h4>
                        <div className="space-y-3">
                            {marketTrends.topSkills.map((skill, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{skill.skill}</div>
                                        <div className="text-sm text-gray-600">
                                            Demand: {skill.demand}% • Growth: {skill.growth > 0 ? '+' : ''}{skill.growth}%
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${skill.demand}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Emerging Roles */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">Emerging Roles</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {marketTrends.emergingRoles.map((role, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <h5 className="font-medium text-gray-900">{role.title}</h5>
                                    <div className="text-sm text-gray-600 mt-1">
                                        Growth: <span className="text-green-600">+{role.growth}%</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Avg Salary: <span className="font-medium">{formatCurrency(role.avgSalary)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">📈</div>
                    <h4 className="font-medium text-gray-900 mb-2">No Market Data Available</h4>
                    <p className="text-gray-600 mb-4">Load market trends for your industry</p>
                    <button
                        onClick={fetchMarketTrends}
                        disabled={loading.trends}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        Get Market Trends
                    </button>
                </div>
            )}
        </div>
    );

    // Skills Gap Tab
    const SkillsTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Skills Gap Analysis</h3>
                <button
                    onClick={fetchSkillsGap}
                    disabled={loading.skills || !userProfile?.skills || !searchParams.targetRole}
                    className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                >
                    {loading.skills ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
            </div>

            {skillsGap ? (
                <div className="space-y-6">
                    {/* Missing Skills */}
                    <div>
                        <h4 className="font-medium text-red-700 mb-3">Skills to Develop</h4>
                        <div className="space-y-4">
                            {skillsGap.missingSkills.map((skill, index) => (
                                <div key={index} className="border border-red-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h5 className="font-medium text-gray-900">{skill.skill}</h5>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${skill.importance === 'critical' ? 'bg-red-100 text-red-800' :
                                                        skill.importance === 'important' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {skill.importance}
                                                </span>
                                                <span className="text-sm text-gray-600">{skill.timeToLearn}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {skill.resources.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Learning Resources:</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {skill.resources.slice(0, 4).map((resource, i) => (
                                                    <div key={i} className="flex items-center text-sm text-gray-600">
                                                        <span className="mr-2">
                                                            {resource.type === 'course' ? '📚' :
                                                                resource.type === 'book' ? '📖' :
                                                                    resource.type === 'certification' ? '🏆' : '🛠️'}
                                                        </span>
                                                        <span className="truncate">{resource.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Strengths */}
                    <div>
                        <h4 className="font-medium text-green-700 mb-3">Your Strengths</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {skillsGap.strengths.map((strength, index) => (
                                <div key={index} className="border border-green-200 rounded-lg p-4">
                                    <h5 className="font-medium text-gray-900">{strength.skill}</h5>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Proficiency</span>
                                            <span className="text-green-600">{(strength.proficiency * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full"
                                                style={{ width: `${strength.proficiency * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Market Value: <span className="text-green-600">{(strength.marketValue * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎯</div>
                    <h4 className="font-medium text-gray-900 mb-2">No Skills Analysis Available</h4>
                    <p className="text-gray-600 mb-4">
                        {!userProfile?.skills ? 'Add your skills to your profile' :
                            !searchParams.targetRole ? 'Set a target role' :
                                'Generate skills gap analysis'}
                    </p>
                    <button
                        onClick={fetchSkillsGap}
                        disabled={!userProfile?.skills || !searchParams.targetRole || loading.skills}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        Analyze Skills Gap
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                    {[
                        { key: 'overview', label: 'Overview', icon: '🏠' },
                        { key: 'salary', label: 'Salary', icon: '💰' },
                        { key: 'trends', label: 'Market Trends', icon: '📈' },
                        { key: 'skills', label: 'Skills Gap', icon: '🎯' },
                        { key: 'career', label: 'Career Path', icon: '🛤️' },
                        { key: 'location', label: 'Location', icon: '🌍' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'salary' && <SalaryTab />}
                {activeTab === 'trends' && <TrendsTab />}
                {activeTab === 'skills' && <SkillsTab />}
                {activeTab === 'career' && (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">🛤️</div>
                        <h4 className="font-medium text-gray-900 mb-2">Career Path Analysis</h4>
                        <p className="text-gray-600">Coming soon...</p>
                    </div>
                )}
                {activeTab === 'location' && (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">🌍</div>
                        <h4 className="font-medium text-gray-900 mb-2">Location Insights</h4>
                        <p className="text-gray-600">Coming soon...</p>
                    </div>
                )}
            </div>
        </div>
    );
}