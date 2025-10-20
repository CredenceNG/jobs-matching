'use client';

import React from 'react';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Linkedin,
    Globe,
    Github,
    Calendar,
    Briefcase,
    GraduationCap,
    Award,
    Code,
    Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

interface ResumeViewerProps {
    resume: ResumeData;
    className?: string;
}

interface ResumeData {
    personalInfo: {
        name: string;
        email: string;
        phone?: string;
        location?: string;
        linkedin?: string;
        website?: string;
        github?: string;
    };
    summary?: string;
    experience: WorkExperience[];
    education: Education[];
    skills: Skill[];
    projects: Project[];
    certifications: Certification[];
}

interface WorkExperience {
    id: string;
    company: string;
    position: string;
    location?: string;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
    description: string[];
}

interface Education {
    id: string;
    institution: string;
    degree: string;
    field: string;
    location?: string;
    startDate: Date;
    endDate?: Date;
    gpa?: number;
}

interface Skill {
    id: string;
    name: string;
    category: string;
    level: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    github?: string;
}

interface Certification {
    id: string;
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
}

export const ResumeViewer: React.FC<ResumeViewerProps> = ({
    resume,
    className
}) => {
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateRange = (startDate: Date, endDate?: Date, isCurrent?: boolean) => {
        const start = formatDate(startDate);
        if (isCurrent) return `${start} - Present`;
        if (endDate) return `${start} - ${formatDate(endDate)}`;
        return start;
    };

    const getSkillLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'expert':
                return 'bg-green-100 text-green-800';
            case 'advanced':
                return 'bg-blue-100 text-blue-800';
            case 'intermediate':
                return 'bg-yellow-100 text-yellow-800';
            case 'beginner':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
            {/* Header - Personal Information */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {resume.personalInfo.name.split(' ').map(n => n[0]).join('')}
                        </div>

                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {resume.personalInfo.name}
                            </h1>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600">
                                {resume.personalInfo.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        <span>{resume.personalInfo.email}</span>
                                    </div>
                                )}

                                {resume.personalInfo.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        <span>{resume.personalInfo.phone}</span>
                                    </div>
                                )}

                                {resume.personalInfo.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span>{resume.personalInfo.location}</span>
                                    </div>
                                )}

                                {resume.personalInfo.linkedin && (
                                    <div className="flex items-center gap-2">
                                        <Linkedin className="h-4 w-4" />
                                        <a href={resume.personalInfo.linkedin} className="text-blue-600 hover:underline">
                                            LinkedIn
                                        </a>
                                    </div>
                                )}

                                {resume.personalInfo.website && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        <a href={resume.personalInfo.website} className="text-blue-600 hover:underline">
                                            Website
                                        </a>
                                    </div>
                                )}

                                {resume.personalInfo.github && (
                                    <div className="flex items-center gap-2">
                                        <Github className="h-4 w-4" />
                                        <a href={resume.personalInfo.github} className="text-blue-600 hover:underline">
                                            GitHub
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Professional Summary */}
            {resume.summary && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Professional Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700 leading-relaxed">{resume.summary}</p>
                    </CardContent>
                </Card>
            )}

            {/* Work Experience */}
            {resume.experience.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            Work Experience
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {resume.experience.map((exp) => (
                            <div key={exp.id} className="border-l-2 border-blue-200 pl-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {exp.position}
                                    </h3>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Calendar className="h-4 w-4" />
                                        {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                                    </div>
                                </div>

                                <p className="text-gray-700 font-medium mb-1">{exp.company}</p>
                                {exp.location && (
                                    <p className="text-sm text-gray-500 mb-3">{exp.location}</p>
                                )}

                                <ul className="space-y-1">
                                    {exp.description.map((item, index) => (
                                        <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                                            <span className="text-blue-500 font-bold text-xs mt-1">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Education */}
            {resume.education.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Education
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {resume.education.map((edu) => (
                            <div key={edu.id} className="flex flex-col sm:flex-row sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {edu.degree} in {edu.field}
                                    </h3>
                                    <p className="text-gray-700">{edu.institution}</p>
                                    {edu.location && (
                                        <p className="text-sm text-gray-500">{edu.location}</p>
                                    )}
                                    {edu.gpa && (
                                        <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDateRange(edu.startDate, edu.endDate)}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Skills */}
            {resume.skills.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="h-5 w-5" />
                            Skills
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {resume.skills.map((skill) => (
                                <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium text-gray-900">{skill.name}</span>
                                    <span className={cn(
                                        'px-2 py-1 rounded-full text-xs font-medium',
                                        getSkillLevelColor(skill.level)
                                    )}>
                                        {skill.level}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Projects */}
            {resume.projects.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5" />
                            Projects
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {resume.projects.map((project) => (
                            <div key={project.id} className="border-l-2 border-green-200 pl-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {project.name}
                                    </h3>
                                    <div className="flex gap-2">
                                        {project.url && (
                                            <a
                                                href={project.url}
                                                className="text-blue-600 hover:underline text-sm"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Live Demo
                                            </a>
                                        )}
                                        {project.github && (
                                            <a
                                                href={project.github}
                                                className="text-gray-600 hover:underline text-sm"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                GitHub
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <p className="text-gray-700 mb-3">{project.description}</p>

                                <div className="flex flex-wrap gap-2">
                                    {project.technologies.map((tech) => (
                                        <span
                                            key={tech}
                                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Certifications */}
            {resume.certifications.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Certifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {resume.certifications.map((cert) => (
                            <div key={cert.id} className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                                    <p className="text-gray-700">{cert.issuer}</p>
                                </div>
                                <div className="text-sm text-gray-500 text-right">
                                    <p>Issued: {formatDate(cert.issueDate)}</p>
                                    {cert.expiryDate && (
                                        <p>Expires: {formatDate(cert.expiryDate)}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};