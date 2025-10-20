/**
 * AI Career Advisor Component
 * 
 * Provides personalized career guidance, path planning, skill development recommendations,
 * and strategic career advice using AI analysis.
 */

'use client';

import { useState } from 'react';

interface CareerGoal {
    id: string;
    title: string;
    targetRole: string;
    timeframe: string;
    priority: 'high' | 'medium' | 'low';
    status: 'not-started' | 'in-progress' | 'completed';
}

interface SkillGap {
    skill: string;
    currentLevel: number;
    requiredLevel: number;
    priority: 'critical' | 'important' | 'nice-to-have';
    estimatedTimeToLearn: string;
    resources: string[];
}

interface CareerPath {
    id: string;
    title: string;
    steps: {
        role: string;
        timeframe: string;
        requiredSkills: string[];
        salaryRange: string;
    }[];
}

interface AICareerAdvisorProps {
    userProfile: {
        name: string;
        role: string;
        experience: string[];
        skills: string[];
        targetRole: string;
        location: string;
    };
}

export function AICareerAdvisor({ userProfile }: AICareerAdvisorProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'skills' | 'paths' | 'advice'>('overview');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAdviceModal, setShowAdviceModal] = useState(false);

    // Mock data - in real implementation, this would come from AI analysis
    const careerGoals: CareerGoal[] = [
        {
            id: '1',
            title: 'Become Senior Software Engineer',
            targetRole: 'Senior Software Engineer',
            timeframe: '6-12 months',
            priority: 'high',
            status: 'in-progress'
        },
        {
            id: '2',
            title: 'Learn Cloud Architecture',
            targetRole: 'Cloud Architect',
            timeframe: '12-18 months',
            priority: 'medium',
            status: 'not-started'
        }
    ];

    const skillGaps: SkillGap[] = [
        {
            skill: 'System Design',
            currentLevel: 3,
            requiredLevel: 7,
            priority: 'critical',
            estimatedTimeToLearn: '3-6 months',
            resources: ['System Design Interview Book', 'Grokking System Design', 'AWS Solutions Architect Course']
        },
        {
            skill: 'Kubernetes',
            currentLevel: 2,
            requiredLevel: 6,
            priority: 'important',
            estimatedTimeToLearn: '2-4 months',
            resources: ['Kubernetes Documentation', 'CKA Certification', 'Hands-on Labs']
        },
        {
            skill: 'Leadership',
            currentLevel: 4,
            requiredLevel: 7,
            priority: 'important',
            estimatedTimeToLearn: '6-12 months',
            resources: ['Tech Lead Course', 'Management Training', 'Mentoring Experience']
        }
    ];

    const careerPaths: CareerPath[] = [
        {
            id: '1',
            title: 'Technical Leadership Track',
            steps: [
                {
                    role: 'Senior Software Engineer',
                    timeframe: '6-12 months',
                    requiredSkills: ['System Design', 'Mentoring', 'Technical Architecture'],
                    salaryRange: '$130K - $180K'
                },
                {
                    role: 'Staff Engineer',
                    timeframe: '2-3 years',
                    requiredSkills: ['Technical Leadership', 'Cross-team Collaboration', 'Strategic Planning'],
                    salaryRange: '$180K - $250K'
                },
                {
                    role: 'Principal Engineer',
                    timeframe: '4-6 years',
                    requiredSkills: ['Technical Vision', 'Industry Expertise', 'Innovation Leadership'],
                    salaryRange: '$250K - $350K'
                }
            ]
        }
    ];

    const handleGenerateAdvice = async () => {
        setIsAnalyzing(true);
        // Simulate AI analysis
        setTimeout(() => {
            setIsAnalyzing(false);
            setShowAdviceModal(true);
        }, 2000);
    };

    const OverviewTab = () => (
        <div className="space-y-6">
            {/* Career Health Score */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Health Score</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold text-blue-600">78/100</div>
                        <p className="text-gray-600">Good progress, focus on skill gaps</p>
                    </div>
                    <div className="w-24 h-24">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="2"
                            />
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeDasharray="78, 100"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={handleGenerateAdvice}
                    disabled={isAnalyzing}
                    className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                    <div className="text-blue-600 text-2xl mb-2">🤖</div>
                    <h4 className="font-semibold text-gray-900">Get AI Advice</h4>
                    <p className="text-sm text-gray-600">Personalized career recommendations</p>
                </button>

                <button
                    onClick={() => setActiveTab('skills')}
                    className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                    <div className="text-green-600 text-2xl mb-2">📚</div>
                    <h4 className="font-semibold text-gray-900">Skill Analysis</h4>
                    <p className="text-sm text-gray-600">Identify and bridge skill gaps</p>
                </button>

                <button
                    onClick={() => setActiveTab('paths')}
                    className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                >
                    <div className="text-purple-600 text-2xl mb-2">🛣️</div>
                    <h4 className="font-semibold text-gray-900">Career Paths</h4>
                    <p className="text-sm text-gray-600">Explore advancement opportunities</p>
                </button>
            </div>

            {/* Recent Insights */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Insights</h3>
                <div className="space-y-3">
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                        <p className="text-sm text-gray-700">
                            <strong>Skill Opportunity:</strong> Adding Kubernetes expertise could increase your market value by 15-20%
                        </p>
                    </div>
                    <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
                        <p className="text-sm text-gray-700">
                            <strong>Career Milestone:</strong> You're 70% ready for a Senior Engineer role based on current skills
                        </p>
                    </div>
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <p className="text-sm text-gray-700">
                            <strong>Market Trend:</strong> Demand for full-stack engineers in {userProfile.location} is up 25% this quarter
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    const GoalsTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Career Goals</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Add Goal
                </button>
            </div>

            <div className="space-y-4">
                {careerGoals.map((goal) => (
                    <div key={goal.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                }`}>
                                {goal.priority}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{goal.targetRole}</p>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">{goal.timeframe}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    goal.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {goal.status.replace('-', ' ')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const SkillsTab = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Skill Gap Analysis</h3>

            <div className="space-y-4">
                {skillGaps.map((gap, index) => (
                    <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-gray-900">{gap.skill}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${gap.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                    gap.priority === 'important' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                }`}>
                                {gap.priority}
                            </span>
                        </div>

                        {/* Skill Level Progress */}
                        <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Current Level: {gap.currentLevel}/10</span>
                                <span>Target Level: {gap.requiredLevel}/10</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${(gap.currentLevel / 10) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                            Estimated time to learn: {gap.estimatedTimeToLearn}
                        </p>

                        <div>
                            <p className="text-sm font-medium text-gray-900 mb-2">Recommended Resources:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                {gap.resources.map((resource, idx) => (
                                    <li key={idx} className="flex items-center">
                                        <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                                        {resource}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const PathsTab = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Recommended Career Paths</h3>

            <div className="space-y-6">
                {careerPaths.map((path) => (
                    <div key={path.id} className="border rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">{path.title}</h4>

                        <div className="space-y-4">
                            {path.steps.map((step, index) => (
                                <div key={index} className="relative">
                                    {index < path.steps.length - 1 && (
                                        <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-200"></div>
                                    )}
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <h5 className="font-medium text-gray-900">{step.role}</h5>
                                            <p className="text-sm text-gray-600">{step.timeframe} • {step.salaryRange}</p>
                                            <div className="mt-2">
                                                <div className="flex flex-wrap gap-2">
                                                    {step.requiredSkills.map((skill, skillIndex) => (
                                                        <span
                                                            key={skillIndex}
                                                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Career Advisor</h2>
                <p className="text-gray-600">
                    Get personalized career guidance and strategic advice to advance your professional journey
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'overview', label: 'Overview', icon: '📊' },
                        { id: 'goals', label: 'Goals', icon: '🎯' },
                        { id: 'skills', label: 'Skills', icon: '📚' },
                        { id: 'paths', label: 'Paths', icon: '🛣️' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
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
            <div className="min-h-96">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'goals' && <GoalsTab />}
                {activeTab === 'skills' && <SkillsTab />}
                {activeTab === 'paths' && <PathsTab />}
            </div>

            {/* AI Advice Modal */}
            {showAdviceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">AI Career Advice</h3>
                            <button
                                onClick={() => setShowAdviceModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">🎯 Focus Area</h4>
                                <p className="text-blue-800 text-sm">
                                    Based on your profile, focus on system design skills to fast-track your promotion to Senior Engineer.
                                    This is your highest-impact growth opportunity.
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <h4 className="font-medium text-green-900 mb-2">💡 Next Steps</h4>
                                <ul className="text-green-800 text-sm space-y-1">
                                    <li>• Enroll in a system design course this month</li>
                                    <li>• Start a side project showcasing architecture skills</li>
                                    <li>• Request to lead a technical design review</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg">
                                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Watch Out For</h4>
                                <p className="text-yellow-800 text-sm">
                                    The market is competitive. Don't delay on skill development - aim to bridge critical gaps within 3-6 months.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAdviceModal(false)}
                            className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Got It!
                        </button>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {isAnalyzing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Analyzing your career profile...</p>
                    </div>
                </div>
            )}
        </div>
    );
}