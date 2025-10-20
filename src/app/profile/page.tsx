'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UserProfileData {
    // Personal Information
    name: string
    email: string
    phone?: string
    location: string

    // Current Status
    currentRole: string
    currentCompany?: string
    employmentStatus: 'employed' | 'unemployed' | 'freelance' | 'student'

    // Experience
    totalYearsExperience: number
    experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
    workHistory: Array<{
        title: string
        company: string
        duration: string
        description: string
    }>

    // Skills & Technologies
    skills: Array<{
        name: string
        proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
        yearsUsed: number
    }>
    certifications: string[]

    // Career Goals
    targetRole: string
    alternativeRoles: string[]
    careerTimeline: 'immediate' | '3-months' | '6-months' | '1-year'
    growthAreas: string[]

    // Preferences
    preferences: {
        jobTypes: ('full-time' | 'part-time' | 'contract' | 'freelance')[]
        workModes: ('remote' | 'hybrid' | 'onsite')[]
        salaryRange: { min: number; max: number; currency: string }
        industries: string[]
        companySizes: ('startup' | 'small' | 'mid-size' | 'large' | 'enterprise')[]
        benefits: string[]
        culturePriorities: string[]
    }

    // Additional Data
    education: Array<{
        degree: string
        institution: string
        year: number
        relevant: boolean
    }>
    portfolio?: string
    linkedIn?: string
    github?: string
    resume?: File
}

export default function ProfilePage() {
    const router = useRouter()
    const [profile, setProfile] = useState<UserProfileData>({
        name: '',
        email: '',
        location: '',
        currentRole: '',
        employmentStatus: 'employed',
        totalYearsExperience: 0,
        experienceLevel: 'mid',
        workHistory: [],
        skills: [],
        certifications: [],
        targetRole: '',
        alternativeRoles: [],
        careerTimeline: '3-months',
        growthAreas: [],
        preferences: {
            jobTypes: ['full-time'],
            workModes: ['remote'],
            salaryRange: { min: 50000, max: 100000, currency: 'USD' },
            industries: [],
            companySizes: [],
            benefits: [],
            culturePriorities: []
        },
        education: []
    })

    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    const steps = [
        { id: 1, title: 'Personal Info', description: 'Basic information about you' },
        { id: 2, title: 'Experience', description: 'Your work history and skills' },
        { id: 3, title: 'Career Goals', description: 'What you\'re looking for' },
        { id: 4, title: 'Preferences', description: 'Job and company preferences' },
        { id: 5, title: 'Review', description: 'Review and save your profile' }
    ]

    const updateProfile = (field: keyof UserProfileData, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }))
    }

    const addSkill = () => {
        const skillName = prompt('Enter skill name:')
        if (skillName) {
            setProfile(prev => ({
                ...prev,
                skills: [...prev.skills, {
                    name: skillName,
                    proficiency: 'intermediate',
                    yearsUsed: 1
                }]
            }))
        }
    }

    const removeSkill = (index: number) => {
        setProfile(prev => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index)
        }))
    }

    const addWorkHistory = () => {
        setProfile(prev => ({
            ...prev,
            workHistory: [...prev.workHistory, {
                title: '',
                company: '',
                duration: '',
                description: ''
            }]
        }))
    }

    const updateWorkHistory = (index: number, field: string, value: string) => {
        setProfile(prev => ({
            ...prev,
            workHistory: prev.workHistory.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }))
    }

    const saveProfile = async () => {
        setIsLoading(true)
        try {
            // Save to localStorage for demo (in real app, save to database)
            localStorage.setItem('userProfile', JSON.stringify(profile))

            // Redirect back to main page
            router.push('/?profile=completed')
        } catch (error) {
            console.error('Error saving profile:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Load existing profile on mount
    useEffect(() => {
        const saved = localStorage.getItem('userProfile')
        if (saved) {
            setProfile(JSON.parse(saved))
        }
    }, [])

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Personal Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={(e) => updateProfile('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Your full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => updateProfile('email', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location *
                                </label>
                                <input
                                    type="text"
                                    value={profile.location}
                                    onChange={(e) => updateProfile('location', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="City, State/Country"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Role *
                                </label>
                                <input
                                    type="text"
                                    value={profile.currentRole}
                                    onChange={(e) => updateProfile('currentRole', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Software Engineer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Employment Status
                                </label>
                                <select
                                    value={profile.employmentStatus}
                                    onChange={(e) => updateProfile('employmentStatus', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="employed">Currently Employed</option>
                                    <option value="unemployed">Unemployed</option>
                                    <option value="freelance">Freelancer</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Years of Experience *
                                </label>
                                <input
                                    type="number"
                                    value={profile.totalYearsExperience}
                                    onChange={(e) => updateProfile('totalYearsExperience', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                    max="50"
                                />
                            </div>
                        </div>
                    </div>
                )

            case 2:
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Experience & Skills</h3>

                        {/* Skills Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium">Skills & Technologies</h4>
                                <button
                                    onClick={addSkill}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Add Skill
                                </button>
                            </div>

                            <div className="space-y-3">
                                {profile.skills.map((skill, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                                        <input
                                            type="text"
                                            value={skill.name}
                                            onChange={(e) => {
                                                const newSkills = [...profile.skills]
                                                newSkills[index].name = e.target.value
                                                updateProfile('skills', newSkills)
                                            }}
                                            className="flex-1 px-3 py-1 border border-gray-300 rounded-md"
                                            placeholder="Skill name"
                                        />
                                        <select
                                            value={skill.proficiency}
                                            onChange={(e) => {
                                                const newSkills = [...profile.skills]
                                                newSkills[index].proficiency = e.target.value as any
                                                updateProfile('skills', newSkills)
                                            }}
                                            className="px-3 py-1 border border-gray-300 rounded-md"
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                            <option value="expert">Expert</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={skill.yearsUsed}
                                            onChange={(e) => {
                                                const newSkills = [...profile.skills]
                                                newSkills[index].yearsUsed = parseInt(e.target.value) || 0
                                                updateProfile('skills', newSkills)
                                            }}
                                            className="w-20 px-3 py-1 border border-gray-300 rounded-md"
                                            placeholder="Years"
                                            min="0"
                                        />
                                        <button
                                            onClick={() => removeSkill(index)}
                                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-md"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Work History */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium">Work History</h4>
                                <button
                                    onClick={addWorkHistory}
                                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                >
                                    Add Position
                                </button>
                            </div>

                            <div className="space-y-4">
                                {profile.workHistory.map((work, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-md">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                            <input
                                                type="text"
                                                value={work.title}
                                                onChange={(e) => updateWorkHistory(index, 'title', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-md"
                                                placeholder="Job Title"
                                            />
                                            <input
                                                type="text"
                                                value={work.company}
                                                onChange={(e) => updateWorkHistory(index, 'company', e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-md"
                                                placeholder="Company Name"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={work.duration}
                                            onChange={(e) => updateWorkHistory(index, 'duration', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
                                            placeholder="Duration (e.g., Jan 2020 - Present)"
                                        />
                                        <textarea
                                            value={work.description}
                                            onChange={(e) => updateWorkHistory(index, 'description', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            placeholder="Brief description of your role and achievements"
                                            rows={3}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Career Goals</h3>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Target Role *
                                </label>
                                <input
                                    type="text"
                                    value={profile.targetRole}
                                    onChange={(e) => updateProfile('targetRole', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Senior Software Engineer, Product Manager"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Career Timeline
                                </label>
                                <select
                                    value={profile.careerTimeline}
                                    onChange={(e) => updateProfile('careerTimeline', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="immediate">Looking now (immediate)</option>
                                    <option value="3-months">Within 3 months</option>
                                    <option value="6-months">Within 6 months</option>
                                    <option value="1-year">Within 1 year</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )

            case 4:
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Job Preferences</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Salary Range (USD)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={profile.preferences.salaryRange.min}
                                        onChange={(e) => updateProfile('preferences', {
                                            ...profile.preferences,
                                            salaryRange: { ...profile.preferences.salaryRange, min: parseInt(e.target.value) || 0 }
                                        })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="Min"
                                    />
                                    <span>to</span>
                                    <input
                                        type="number"
                                        value={profile.preferences.salaryRange.max}
                                        onChange={(e) => updateProfile('preferences', {
                                            ...profile.preferences,
                                            salaryRange: { ...profile.preferences.salaryRange, max: parseInt(e.target.value) || 0 }
                                        })}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="Max"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Work Mode Preferences
                                </label>
                                <div className="space-y-2">
                                    {['remote', 'hybrid', 'onsite'].map(mode => (
                                        <label key={mode} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={profile.preferences.workModes.includes(mode as any)}
                                                onChange={(e) => {
                                                    const newModes = e.target.checked
                                                        ? [...profile.preferences.workModes, mode as any]
                                                        : profile.preferences.workModes.filter(m => m !== mode)
                                                    updateProfile('preferences', { ...profile.preferences, workModes: newModes })
                                                }}
                                                className="mr-2"
                                            />
                                            <span className="capitalize">{mode}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 5:
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Review Your Profile</h3>

                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold mb-2">Personal Info</h4>
                                    <p><strong>Name:</strong> {profile.name}</p>
                                    <p><strong>Email:</strong> {profile.email}</p>
                                    <p><strong>Location:</strong> {profile.location}</p>
                                    <p><strong>Current Role:</strong> {profile.currentRole}</p>
                                    <p><strong>Experience:</strong> {profile.totalYearsExperience} years</p>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Career Goals</h4>
                                    <p><strong>Target Role:</strong> {profile.targetRole}</p>
                                    <p><strong>Timeline:</strong> {profile.careerTimeline}</p>
                                    <p><strong>Salary Range:</strong> ${profile.preferences.salaryRange.min?.toLocaleString()} - ${profile.preferences.salaryRange.max?.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="font-semibold mb-2">Skills ({profile.skills.length})</h4>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.slice(0, 10).map((skill, index) => (
                                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                            {skill.name} ({skill.proficiency})
                                        </span>
                                    ))}
                                    {profile.skills.length > 10 && (
                                        <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm">
                                            +{profile.skills.length - 10} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
                    <p className="text-gray-600">Help our AI find the perfect jobs for you</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                    }
                `}>
                                    {step.id}
                                </div>
                                <div className="ml-3 hidden sm:block">
                                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                                    <p className="text-xs text-gray-500">{step.description}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="ml-6 w-20 h-px bg-gray-300 hidden sm:block" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    {renderStep()}
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                    <button
                        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        disabled={currentStep === 1}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    {currentStep < 5 ? (
                        <button
                            onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={saveProfile}
                            disabled={isLoading}
                            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Save Profile'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}