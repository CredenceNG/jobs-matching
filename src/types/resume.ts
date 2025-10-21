// Resume-related TypeScript interfaces and types

export interface ParsedResume {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  lastModified: Date;

  // Personal Information
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
    github?: string;
  };

  // Professional Summary
  summary?: string;

  // Work Experience
  experience: WorkExperience[];

  // Education
  education: Education[];

  // Skills
  skills: Skill[];

  // Projects
  projects: Project[];

  // Certifications
  certifications: Certification[];

  // Languages
  languages: Language[];

  // Additional Sections
  achievements?: string[];
  volunteer?: VolunteerWork[];
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: Date;
  endDate?: Date; // null if current
  isCurrent: boolean;
  description: string[];
  achievements?: string[];
  responsibilities?: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  gpa?: number;
  honors?: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  yearsOfExperience?: number;
}

export type SkillCategory =
  | "technical"
  | "programming"
  | "software"
  | "language"
  | "soft-skill"
  | "certification";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  startDate: Date;
  endDate?: Date;
  url?: string;
  link?: string; // alias for url
  github?: string;
  achievements?: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: LanguageProficiency;
}

export type LanguageProficiency =
  | "native"
  | "fluent"
  | "conversational"
  | "basic";

export interface VolunteerWork {
  id: string;
  organization: string;
  role: string;
  startDate: Date;
  endDate?: Date;
  description: string[];
}

// Resume Analysis Types
export interface ResumeAnalysis {
  overallScore: number; // 0-100
  sections: SectionAnalysis[];
  strengths: string[];
  weaknesses: string[];
  suggestions: OptimizationSuggestion[];
  atsCompatibility: ATSCompatibility;
  keywordAnalysis: KeywordAnalysis;
}

export interface SectionAnalysis {
  section: ResumeSectionType;
  score: number;
  present: boolean;
  quality: "excellent" | "good" | "fair" | "poor";
  feedback: string;
  suggestions: string[];
}

export type ResumeSectionType =
  | "personal-info"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications";

export interface OptimizationSuggestion {
  id: string;
  type: SuggestionType;
  priority: "high" | "medium" | "low";
  section: ResumeSectionType;
  title: string;
  description: string;
  before?: string;
  after?: string;
  impact: string;
}

export type SuggestionType =
  | "content"
  | "formatting"
  | "keywords"
  | "structure"
  | "length"
  | "grammar";

export interface ATSCompatibility {
  score: number;
  issues: ATSIssue[];
  recommendations: string[];
}

export interface ATSIssue {
  type: "formatting" | "structure" | "content";
  severity: "critical" | "warning" | "info";
  description: string;
  suggestion: string;
}

export interface KeywordAnalysis {
  totalKeywords: number;
  industryKeywords: string[];
  missingKeywords: string[];
  keywordDensity: { [key: string]: number };
  recommendations: string[];
}

// File Upload Types
export interface UploadedFile {
  file: File;
  preview?: string;
  status: "uploading" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
}

export interface ResumeUploadResult {
  success: boolean;
  resumeId?: string;
  parsedResume?: ParsedResume;
  analysis?: ResumeAnalysis;
  error?: string;
}
