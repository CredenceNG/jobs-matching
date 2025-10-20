/**
 * Resume Parser Service
 * Uses AI to extract structured information from resume text
 */

import { getAIService, isAIServiceAvailable } from '@/lib/ai/request-scoped-service'

interface ParsedResumeData {
  skills: string[]
  experience: string
  location?: string
  jobTitles: string[]
  industries: string[]
  education?: string
  certifications?: string[]
  summary?: string
}

export class ResumeParserService {
  /**
   * Parse resume text using AI to extract structured data
   */
  async parseResumeText(resumeText: string): Promise<ParsedResumeData> {
    try {
      // Try AI analysis first if available
      if (isAIServiceAvailable()) {
        console.log('🤖 Using AI-Enhanced Resume Analysis...')
        return await this.aiEnhancedParsing(resumeText)
      } else {
        console.log('⚡ AI service unavailable, using basic text analysis...')
        return this.basicTextAnalysis(resumeText)
      }
    } catch (error) {
      console.error('❌ Resume parsing error:', error)
      console.log('🔄 Falling back to basic text analysis...')
      return this.basicTextAnalysis(resumeText)
    }
  }

  /**
   * AI-Enhanced resume parsing using Claude
   */
  async aiEnhancedParsing(resumeText: string): Promise<ParsedResumeData> {
    const analysisPrompt = `
You are an expert resume parser. Analyze this resume text and extract structured information.

Resume Text:
${resumeText}

Please extract and return the following information in JSON format:
{
  "skills": ["list of technical and soft skills mentioned"],
  "experience": "experience level (entry-level, mid-level, senior, executive)",
  "location": "preferred work location if mentioned",
  "jobTitles": ["list of job titles/positions held"],
  "industries": ["list of industries/sectors mentioned"],
  "education": "highest education level",
  "certifications": ["list of certifications if any"],
  "summary": "brief summary of the candidate's profile"
}

Focus on:
1. Technical skills (programming languages, tools, technologies)
2. Soft skills (leadership, communication, etc.)
3. Years of experience or experience level
4. Job titles and company names
5. Industry experience
6. Education and certifications
7. Location preferences (if any)

Return only valid JSON without any additional text or formatting.
`

      const aiService = getAIService()
      const response = await aiService.makeRequest<string>(analysisPrompt, {
        maxTokens: 1000,
        temperature: 0.1,
        feature: 'resume_parsing' as any
      })
      
      // Parse the AI response
      let parsedData: ParsedResumeData
      try {
        parsedData = JSON.parse(response)
      } catch (parseError) {
        console.log('Failed to parse AI response as JSON, using basic analysis')
        throw new Error('AI response parsing failed')
      }

      return this.validateParsedData(parsedData)
    } catch (error) {
      console.error('AI parsing error:', error)
      throw error // Re-throw to be caught by parent method
    }
  }

  /**
   * Generate job search keywords from parsed resume data
   */
  generateJobSearchKeywords(parsedData: ParsedResumeData): string {
    const keywords: string[] = []

    // Add primary skills
    if (parsedData.skills && parsedData.skills.length > 0) {
      keywords.push(...parsedData.skills.slice(0, 5)) // Top 5 skills
    }

    // Add job titles
    if (parsedData.jobTitles && parsedData.jobTitles.length > 0) {
      keywords.push(...parsedData.jobTitles.slice(0, 2)) // Top 2 job titles
    }

    // Add industries
    if (parsedData.industries && parsedData.industries.length > 0) {
      keywords.push(parsedData.industries[0]) // Primary industry
    }

    return keywords.join(' ')
  }

  /**
   * Generate location for job search
   */
  generateJobSearchLocation(parsedData: ParsedResumeData): string {
    if (parsedData.location) {
      return parsedData.location
    }
    
    // Default to remote if no location specified
    return 'Remote'
  }

  /**
   * Validate and clean parsed data
   */
  private validateParsedData(data: any): ParsedResumeData {
    return {
      skills: Array.isArray(data.skills) ? data.skills.filter(Boolean) : [],
      experience: typeof data.experience === 'string' ? data.experience : 'mid-level',
      location: typeof data.location === 'string' ? data.location : undefined,
      jobTitles: Array.isArray(data.jobTitles) ? data.jobTitles.filter(Boolean) : [],
      industries: Array.isArray(data.industries) ? data.industries.filter(Boolean) : [],
      education: typeof data.education === 'string' ? data.education : undefined,
      certifications: Array.isArray(data.certifications) ? data.certifications.filter(Boolean) : [],
      summary: typeof data.summary === 'string' ? data.summary : undefined,
    }
  }

  /**
   * Extract data from AI text response (fallback)
   */
  private extractDataFromText(text: string): ParsedResumeData {
    const skills: string[] = []
    const jobTitles: string[] = []
    const industries: string[] = []

    // Common technical skills to look for
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'TypeScript',
      'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'PostgreSQL',
      'Git', 'API', 'REST', 'GraphQL', 'HTML', 'CSS', 'Vue', 'Angular'
    ]

    const lowerText = text.toLowerCase()
    
    commonSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.push(skill)
      }
    })

    return {
      skills: skills.slice(0, 10),
      experience: 'mid-level',
      jobTitles,
      industries,
    }
  }

  /**
   * Basic text analysis (fallback)
   */
  public basicTextAnalysis(resumeText: string): ParsedResumeData {
    const text = resumeText.toLowerCase()
    const originalText = resumeText
    const skills: string[] = []
    const jobTitles: string[] = []
    const industries: string[] = []
    
    // Extract common technical skills
    const techSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
      'HTML', 'CSS', 'Sass', 'Bootstrap', 'Tailwind',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins',
      'Git', 'GitHub', 'GitLab', 'Jira', 'Slack',
      'REST', 'GraphQL', 'API', 'Microservices', 'DevOps',
      'Machine Learning', 'AI', 'Data Science', 'Analytics'
    ]

    // Extract soft skills
    const softSkills = [
      'Leadership', 'Communication', 'Team Management', 'Project Management',
      'Problem Solving', 'Critical Thinking', 'Collaboration', 'Agile', 'Scrum'
    ]

    // Check for technical skills
    techSkills.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        skills.push(skill)
      }
    })

    // Check for soft skills
    softSkills.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        skills.push(skill)
      }
    })

    // Extract job titles (common patterns)
    const commonJobTitles = [
      'Software Developer', 'Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
      'Data Scientist', 'Data Engineer', 'DevOps Engineer', 'Machine Learning Engineer',
      'Product Manager', 'Project Manager', 'Technical Lead', 'Engineering Manager',
      'UI/UX Designer', 'Designer', 'Analyst', 'Consultant', 'Architect'
    ]

    commonJobTitles.forEach(title => {
      if (text.includes(title.toLowerCase())) {
        jobTitles.push(title)
      }
    })

    // Extract industries/sectors
    const commonIndustries = [
      'Technology', 'Software', 'Fintech', 'Healthcare', 'E-commerce', 'Finance',
      'Consulting', 'Startup', 'Enterprise', 'SaaS', 'Cloud', 'Mobile'
    ]

    commonIndustries.forEach(industry => {
      if (text.includes(industry.toLowerCase())) {
        industries.push(industry)
      }
    })

    // Determine experience level
    let experience = 'mid-level'
    if (text.includes('senior') || text.includes('lead') || text.includes('manager') || text.includes('principal')) {
      experience = 'senior'
    } else if (text.includes('junior') || text.includes('entry') || text.includes('intern') || text.includes('graduate')) {
      experience = 'entry-level'
    } else if (text.includes('executive') || text.includes('director') || text.includes('vp') || text.includes('chief')) {
      experience = 'executive'
    }

    // Extract location (look for common location patterns)
    let location: string | undefined
    const locationPatterns = [
      /(?:remote|work from home)/i,
      /([a-zA-Z\s]+),\s*([A-Z]{2})/g, // City, State format
      /([a-zA-Z\s]+),\s*([a-zA-Z\s]+)/g // City, Country format
    ]

    for (const pattern of locationPatterns) {
      const matches = originalText.match(pattern)
      if (matches && matches[0]) {
        location = matches[0].trim()
        break
      }
    }

    // Extract education level
    let education: string | undefined
    if (text.includes('phd') || text.includes('doctorate')) {
      education = 'PhD'
    } else if (text.includes('master') || text.includes('mba') || text.includes('ms ') || text.includes('m.s.')) {
      education = 'Masters'
    } else if (text.includes('bachelor') || text.includes('bs ') || text.includes('b.s.') || text.includes('ba ') || text.includes('b.a.')) {
      education = 'Bachelors'
    }

    // Extract certifications (look for common certification patterns)
    const certifications: string[] = []
    const certPatterns = [
      /AWS Certified/gi,
      /Google Cloud/gi,
      /Azure/gi,
      /PMP/gi,
      /Scrum Master/gi,
      /Agile/gi
    ]

    certPatterns.forEach(pattern => {
      const matches = originalText.match(pattern)
      if (matches) {
        matches.forEach(match => {
          certifications.push(match.trim())
        })
      }
    })

    return {
      skills: Array.from(new Set(skills)), // Remove duplicates
      experience,
      location,
      jobTitles: Array.from(new Set(jobTitles)),
      industries: Array.from(new Set(industries)),
      education,
      certifications: Array.from(new Set(certifications)),
      summary: `${experience} professional with expertise in ${skills.slice(0, 3).join(', ')}`
    }
  }
}

// Export singleton instance
export const resumeParserService = new ResumeParserService()