/**
 * AI-ONLY Job Search API Route
 *
 * Pure AI approach - NO external job APIs or scraping:
 * 1. AI analyzes resume and generates smart search queries
 * 2. AI searches the web for real job postings
 * 3. AI extracts and structures job data from search results
 * 4. AI matches and ranks jobs by relevance
 * 5. AI generates personalized recommendations
 *
 * @route POST /api/ai-job-search
 * @version 3.0.0 - Fully AI-Powered
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import pdf from 'pdf-parse'

// =============================================================================
// CONFIGURATION
// =============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = process.env.AI_DEFAULT_MODEL || 'claude-sonnet-4-5-20250929'

// =============================================================================
// TYPES
// =============================================================================

interface ParsedResume {
  name?: string
  skills: string[]
  experience: string[]
  education?: string[]
  yearsExperience?: number
  desiredRole?: string
  location?: string
}

interface JobMatch {
  id: string
  title: string
  company: string
  location: string
  description: string
  requirements?: string[]
  salary?: string
  url?: string
  matchScore: number
  matchingSkills?: string[]
  missingSkills?: string[]
  recommendation?: string
  source?: string
  postedDate?: string
  remote?: boolean
}

// =============================================================================
// STEP 1: PARSE RESUME WITH AI
// =============================================================================

async function parseResumeWithAI(resumeText: string): Promise<ParsedResume> {
  console.log('📄 Parsing resume with AI...')

  const prompt = `Extract key information from this resume:

${resumeText.substring(0, 5000)}

Extract and return ONLY valid JSON in this format:
{
  "name": "Full Name",
  "skills": ["skill1", "skill2", ...],
  "experience": ["job title 1", "job title 2", ...],
  "education": ["degree 1", ...],
  "yearsExperience": 5,
  "desiredRole": "inferred from resume",
  "location": "city/state if mentioned"
}

Focus on technical skills, job titles, and years of experience.`

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const cleanedText = content.text
        .trim()
        .replace(/^```json?\n?/i, '')
        .replace(/\n?```$/, '')
        .trim()

      const parsed = JSON.parse(cleanedText)
      console.log('✅ Resume parsed successfully:')
      console.log(`   Skills: ${parsed.skills?.slice(0, 5).join(', ')}`)
      console.log(`   Experience: ${parsed.experience?.slice(0, 2).join(', ')}`)
      console.log(`   Years: ${parsed.yearsExperience || 'unknown'}`)
      console.log(`   Location: ${parsed.location || 'not specified'}`)
      return parsed
    }

    throw new Error('Invalid AI response format')
  } catch (error) {
    console.error('❌ Resume parsing failed:', error)
    // Return fallback structure
    return {
      skills: ['JavaScript', 'Python', 'React'],
      experience: ['Software Engineer'],
      yearsExperience: 3
    }
  }
}

// =============================================================================
// STEP 1.5: QUICK CAREER ASSESSMENT (Identify optimal role pivots)
// =============================================================================

/**
 * Performs a quick career assessment to identify optimal role types before searching
 * This runs BEFORE search query generation to ensure queries target the right roles
 *
 * @param resume - Parsed resume data
 * @returns Array of 3-5 recommended job titles/role types
 *
 * Example: IT Manager with cloud skills → ["DevOps Engineer", "Cloud Architect", "SRE"]
 */
async function quickCareerAssessment(resume: ParsedResume): Promise<string[]> {
  console.log('🎯 Running quick career assessment...')

  const prompt = `Analyze this candidate's profile and identify 3-5 optimal job titles they should target:

CANDIDATE PROFILE:
Skills: ${resume.skills.slice(0, 15).join(', ')}
Experience: ${resume.experience.join(', ')}
Years: ${resume.yearsExperience || 'unknown'}

CRITICAL ANALYSIS RULES:
1. If they have management/leadership + technical skills → Suggest leadership AND individual contributor roles
2. If they have infrastructure/cloud skills but seeking "developer" roles → Suggest DevOps, SRE, Cloud Architect
3. If they have ERP/database background → Suggest consultant, implementation, architect roles
4. If they have broad IT skills → Suggest roles that leverage full breadth, not narrow specializations
5. Mix seniority levels: Include both current level and one level up

OUTPUT REQUIREMENTS:
- Return ACTUAL job titles that exist in job boards (e.g., "DevOps Engineer", not "Cloud Professional")
- Include roles that bridge their backgrounds (e.g., "DevOps Engineer" for IT Mgr + Azure)
- Prioritize roles with HIGHEST market demand for their skills
- Include 1-2 "pivot" roles if profile suggests mismatch with likely search intent

Return ONLY valid JSON: { "roles": ["Job Title 1", "Job Title 2", "Job Title 3", "Job Title 4", "Job Title 5"] }`

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 200,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const cleanedText = content.text
        .trim()
        .replace(/^```json?\n?/i, '')
        .replace(/\n?```$/, '')
        .trim()

      const parsed = JSON.parse(cleanedText)
      const roles = parsed.roles || []
      console.log(`✅ Career assessment suggests: ${roles.join(', ')}`)
      return roles
    }
  } catch (error) {
    console.error('❌ Career assessment failed:', error)
  }

  // Fallback: Use experience roles
  return resume.experience.slice(0, 3)
}

// =============================================================================
// STEP 2: GENERATE SMART SEARCH QUERIES WITH AI
// =============================================================================

async function generateSearchQueries(resume: ParsedResume, suggestedRoles: string[] = []): Promise<string[]> {
  console.log('🔍 Generating search queries with AI...')
  console.log(`   Using resume: ${resume.skills?.length || 0} skills, ${resume.experience?.length || 0} roles`)
  console.log(`   Suggested roles: ${suggestedRoles.join(', ')}`)

  const prompt = `Based on this candidate profile, generate 5 effective job search queries:

CANDIDATE PROFILE:
Skills: ${resume.skills.join(', ')}
Experience: ${resume.experience.join(', ')}
Years: ${resume.yearsExperience || 'unknown'}
Location: ${resume.location || 'any'}

RECOMMENDED ROLE TYPES (PRIORITIZE THESE):
${suggestedRoles.length > 0 ? suggestedRoles.join(', ') : 'Use experience roles'}

QUERY GENERATION RULES:
1. Create 5 diverse search queries
2. PRIORITIZE queries for the recommended role types above
3. Mix role titles with key technical skills
4. Include location if specified
5. Vary seniority levels (current + one level up)
6. Include 1-2 queries that bridge multiple skill areas

IMPORTANT: Focus queries on the RECOMMENDED ROLES, not just the resume's current job title.

Return ONLY valid JSON: { "queries": ["query1", "query2", ...] }`

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const cleanedText = content.text
        .trim()
        .replace(/^```json?\n?/i, '')
        .replace(/\n?```$/, '')
        .trim()

      const parsed = JSON.parse(cleanedText)
      console.log(`✅ Generated ${parsed.queries?.length || 0} queries`)
      return parsed.queries || []
    }
  } catch (error) {
    console.error('❌ Query generation failed:', error)
  }

  // Fallback queries
  const fallbackQueries = [
    `${resume.experience[0] || 'Software Engineer'} ${resume.skills[0] || 'Developer'}`,
    `${resume.skills.slice(0, 2).join(' ')} Developer`,
    `Remote ${resume.desiredRole || resume.experience[0] || 'Engineer'}`
  ]

  return fallbackQueries
}

// =============================================================================
// STEP 3: SEARCH JOBS VIA API
// =============================================================================

/**
 * Search for real jobs using OpenWeb Ninja API
 *
 * This approach:
 * 1. Uses OpenWeb Ninja API for real job postings
 * 2. Returns structured job data
 * 3. Falls back to mock data only if API fails
 *
 * @returns Object with { jobs: any[], usedMockData: boolean }
 * The usedMockData flag indicates if we fell back to mock data
 */
async function searchJobsViaAI(queries: string[]): Promise<{ jobs: any[], usedMockData: boolean }> {
  console.log('🔍 Searching for real jobs via API...')

  try {
    // Import the OpenWeb Ninja API
    const { OpenWebNinjaAPI } = await import('@/lib/services/openweb-ninja-api')
    const jobAPI = new OpenWebNinjaAPI()

    const allJobs: any[] = []

    // Search with first 2 queries to balance results
    for (const query of queries.slice(0, 2)) {
      try {
        console.log(`  🔍 Searching: "${query}"`)

        const jobs = await jobAPI.searchJobs(query)

        if (jobs && jobs.length > 0) {
          // Transform to expected format
          const transformed = jobs.map(job => ({
            job_id: job.id,
            job_title: job.title,
            employer_name: job.company,
            job_city: job.location.split(',')[0]?.trim() || job.location,
            job_state: job.location.split(',')[1]?.trim() || '',
            job_country: job.location.split(',')[2]?.trim() || 'US',
            job_description: job.description,
            job_min_salary: job.salary ? parseInt(job.salary.replace(/\D/g, '')) || undefined : undefined,
            job_max_salary: job.salary ? (parseInt(job.salary.replace(/\D/g, '')) * 1.2) || undefined : undefined,
            job_is_remote: job.type?.toLowerCase().includes('remote') || false,
            job_apply_link: job.url || '',
            job_publisher: job.source || 'OpenWeb Ninja',
            job_posted_at_datetime_utc: job.posted_date || new Date().toISOString()
          }))

          allJobs.push(...transformed)
          console.log(`  ✓ Found ${jobs.length} jobs for "${query}"`)
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`  ✗ Search failed for "${query}":`, error)
      }
    }

    if (allJobs.length === 0) {
      console.log('⚠️  No jobs found via API, using mock data')
      return { jobs: getMockJobs(queries), usedMockData: true }
    }

    console.log(`✅ Collected ${allJobs.length} total jobs`)
    return { jobs: allJobs, usedMockData: false }

  } catch (error) {
    console.error('❌ Job search failed:', error)
    console.log('⚠️  Falling back to mock data')
    return { jobs: getMockJobs(queries), usedMockData: true }
  }
}

// =============================================================================
// STEP 4: AI MATCHES AND RANKS JOBS
// =============================================================================

async function matchAndRankJobs(
  resume: ParsedResume,
  rawJobs: any[]
): Promise<JobMatch[]> {
  console.log('🤖 AI matching and ranking jobs...')

  // Take first 10 jobs to avoid token limits
  const jobsToProcess = rawJobs.slice(0, 10).map(job => ({
    id: job.job_id || Math.random().toString(36).substr(2, 9),
    title: job.job_title || job.title || 'Unknown Position',
    company: job.employer_name || job.company || 'Unknown Company',
    location: job.job_city && job.job_state
      ? `${job.job_city}, ${job.job_state}`
      : job.job_country || 'Unknown Location',
    description: (job.job_description || job.description || '').substring(0, 500),
    salary: job.job_min_salary && job.job_max_salary
      ? `$${job.job_min_salary.toLocaleString()}-$${job.job_max_salary.toLocaleString()}`
      : undefined,
    url: job.job_apply_link || job.url || '',
    source: job.job_publisher || 'Unknown',
    remote: job.job_is_remote || false,
    postedDate: job.job_posted_at_datetime_utc
  }))

  const prompt = `Match these jobs against the candidate's profile and rank by relevance:

CANDIDATE:
Skills: ${resume.skills.slice(0, 15).join(', ')}
Experience: ${resume.experience.join(', ')}
Years: ${resume.yearsExperience || 'unknown'}

JOBS:
${JSON.stringify(jobsToProcess, null, 2)}

For each job:
1. Calculate match score (0-100) based on skills overlap and experience level
2. Identify matching skills
3. Identify missing/gap skills
4. Provide brief recommendation (should they apply?)

Return ONLY valid JSON in this format:
{
  "matches": [
    {
      "id": "job_id",
      "title": "Job Title",
      "company": "Company",
      "location": "Location",
      "description": "description",
      "salary": "salary range",
      "url": "url",
      "source": "source",
      "remote": true/false,
      "postedDate": "date",
      "matchScore": 85,
      "matchingSkills": ["skill1", "skill2"],
      "missingSkills": ["skill3"],
      "recommendation": "Strong match, apply immediately"
    }
  ]
}`

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const cleanedText = content.text
        .trim()
        .replace(/^```json?\n?/i, '')
        .replace(/\n?```$/, '')
        .trim()

      const parsed = JSON.parse(cleanedText)
      console.log(`✅ Matched ${parsed.matches?.length || 0} jobs`)

      // Sort by match score
      const matches = (parsed.matches || []).sort(
        (a: JobMatch, b: JobMatch) => b.matchScore - a.matchScore
      )

      return matches
    }
  } catch (error) {
    console.error('❌ Job matching failed:', error)
  }

  // Fallback: Return jobs with basic scores
  return jobsToProcess.map((job, index) => ({
    ...job,
    matchScore: 85 - (index * 5), // Decreasing scores
    matchingSkills: resume.skills.slice(0, 3),
    missingSkills: [],
    recommendation: 'Review job details to assess fit'
  }))
}

// =============================================================================
// STEP 5: GENERATE RECOMMENDATIONS
// =============================================================================

async function generateRecommendations(
  resume: ParsedResume,
  matches: JobMatch[]
): Promise<string[]> {
  console.log('💡 Generating recommendations...')

  if (matches.length === 0) {
    return [
      'Broaden your search criteria to include more job titles',
      'Consider adding related skills to your resume',
      'Try searching in nearby cities or remote positions'
    ]
  }

  const prompt = `Based on the job search results, provide 4-5 specific, actionable recommendations:

CANDIDATE:
Skills: ${resume.skills.join(', ')}
Experience: ${resume.experience.join(', ')}

RESULTS:
Jobs Found: ${matches.length}
Top Matches: ${matches.slice(0, 3).map(m => m.title).join(', ')}
Average Score: ${Math.round(matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length)}%

Return ONLY valid JSON: { "recommendations": ["rec1", "rec2", ...] }`

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      temperature: 0.6,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const cleanedText = content.text
        .trim()
        .replace(/^```json?\n?/i, '')
        .replace(/\n?```$/, '')
        .trim()

      const parsed = JSON.parse(cleanedText)
      console.log(`✅ Generated ${parsed.recommendations?.length || 0} recommendations`)
      return parsed.recommendations || []
    }
  } catch (error) {
    console.error('❌ Recommendation generation failed:', error)
  }

  return [
    'Continue applying to top matched positions',
    'Tailor your resume for each specific role',
    'Highlight relevant projects and achievements'
  ]
}

// =============================================================================
// MOCK DATA (FOR TESTING WITHOUT API KEY)
// =============================================================================

function getMockJobs(queries: string[]): any[] {
  return [
    {
      job_id: 'mock_1',
      job_title: 'Senior Full Stack Engineer',
      employer_name: 'TechCorp Inc',
      job_city: 'San Francisco',
      job_state: 'CA',
      job_country: 'US',
      job_description: 'We are seeking an experienced Full Stack Engineer with expertise in React, Node.js, and cloud technologies. You will lead development of scalable web applications.',
      job_min_salary: 150000,
      job_max_salary: 200000,
      job_is_remote: true,
      job_apply_link: 'https://example.com/apply/1',
      job_publisher: 'LinkedIn',
      job_posted_at_datetime_utc: new Date().toISOString()
    },
    {
      job_id: 'mock_2',
      job_title: 'Software Engineer',
      employer_name: 'InnovateLabs',
      job_city: 'Austin',
      job_state: 'TX',
      job_country: 'US',
      job_description: 'Join our team building next-gen software solutions. Strong JavaScript skills required.',
      job_min_salary: 120000,
      job_max_salary: 160000,
      job_is_remote: false,
      job_apply_link: 'https://example.com/apply/2',
      job_publisher: 'Indeed',
      job_posted_at_datetime_utc: new Date(Date.now() - 86400000).toISOString()
    },
    {
      job_id: 'mock_3',
      job_title: 'Frontend Developer',
      employer_name: 'WebSolutions Co',
      job_city: 'Seattle',
      job_state: 'WA',
      job_country: 'US',
      job_description: 'Looking for a talented Frontend Developer with React expertise. Remote-friendly.',
      job_min_salary: 110000,
      job_max_salary: 150000,
      job_is_remote: true,
      job_apply_link: 'https://example.com/apply/3',
      job_publisher: 'Glassdoor',
      job_posted_at_datetime_utc: new Date(Date.now() - 172800000).toISOString()
    },
    {
      job_id: 'mock_4',
      job_title: 'Backend Engineer',
      employer_name: 'DataStream Systems',
      job_city: 'New York',
      job_state: 'NY',
      job_country: 'US',
      job_description: 'Build scalable backend systems with Node.js, PostgreSQL, and microservices architecture.',
      job_min_salary: 140000,
      job_max_salary: 180000,
      job_is_remote: false,
      job_apply_link: 'https://example.com/apply/4',
      job_publisher: 'Indeed',
      job_posted_at_datetime_utc: new Date(Date.now() - 259200000).toISOString()
    },
    {
      job_id: 'mock_5',
      job_title: 'Full Stack Developer',
      employer_name: 'CloudTech Solutions',
      job_city: 'Denver',
      job_state: 'CO',
      job_country: 'US',
      job_description: 'Work on cloud-native applications using modern tech stack. AWS experience preferred.',
      job_min_salary: 130000,
      job_max_salary: 170000,
      job_is_remote: true,
      job_apply_link: 'https://example.com/apply/5',
      job_publisher: 'LinkedIn',
      job_posted_at_datetime_utc: new Date(Date.now() - 345600000).toISOString()
    }
  ]
}

// =============================================================================
// STEP 6: EXTRACT REFINED QUERIES FROM RECOMMENDATIONS
// =============================================================================

/**
 * Extracts actionable job search queries from AI recommendations
 *
 * Example: "Pivot to DevOps Engineer roles" → ["DevOps Engineer", "Site Reliability Engineer"]
 * Example: "Get AWS certification" → ["AWS Developer", "AWS Solutions Architect"]
 *
 * @param recommendations - Array of strategic career recommendations
 * @param resume - Parsed resume data for context
 * @returns Array of refined search queries
 */
async function extractRefinedQueriesFromRecommendations(
  recommendations: string[],
  resume: ParsedResume
): Promise<string[]> {
  const prompt = `Extract specific job titles and role types from these career recommendations:

RECOMMENDATIONS:
${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

CURRENT PROFILE:
- Skills: ${resume.skills.join(', ')}
- Experience: ${resume.experience.join(', ')}

Extract 3-5 specific job titles or role types that the candidate should target based on these recommendations.

CRITICAL RULES:
- Return ACTUAL job titles that exist in the market (e.g., "DevOps Engineer", "Cloud Architect", "Full Stack Developer")
- DO NOT return generic terms like "developer" or "engineer"
- Focus on roles explicitly mentioned or strongly implied in the recommendations
- If recommendations suggest pivoting to different roles, prioritize those
- If recommendations mention specific technologies, include roles focused on those (e.g., "AWS Developer", "React Developer")

Return ONLY valid JSON: { "queries": ["Job Title 1", "Job Title 2", "Job Title 3"] }`

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const cleanedText = content.text
        .trim()
        .replace(/^```json?\n?/i, '')
        .replace(/\n?```$/, '')
        .trim()

      const parsed = JSON.parse(cleanedText)
      return parsed.queries || []
    }
  } catch (error) {
    console.error('❌ Failed to extract refined queries:', error)
  }

  return []
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  console.log('\n🚀 AI Job Search started')
  const startTime = Date.now()

  try {
    // Parse form data
    const formData = await request.formData()
    const resumeFile = formData.get('resume') as File

    if (!resumeFile) {
      return NextResponse.json(
        { success: false, error: 'No resume file provided' },
        { status: 400 }
      )
    }

    // =========================================================================
    // FAST PATH: Return mock data immediately if no AI key configured
    // This prevents timeouts by skipping all AI calls
    // =========================================================================
    if (!anthropic.apiKey) {
      console.warn('⚡ FAST PATH: No AI key configured, returning mock data immediately')

      const mockMatches = getMockJobs([]).map((job, index) => ({
        id: job.job_id,
        title: job.job_title,
        company: job.employer_name,
        location: job.job_city || 'Remote',
        description: job.job_description,
        salary: job.job_min_salary ? `$${job.job_min_salary} - $${job.job_max_salary}` : undefined,
        url: job.job_apply_link,
        matchScore: 95 - (index * 5), // Descending scores: 95, 90, 85, 80, 75
        matchingSkills: ['JavaScript', 'Python', 'React', 'Node.js'],
        missingSkills: ['AWS', 'Docker'],
        recommendation: index === 0 ? 'Excellent Match' : index === 1 ? 'Strong Match' : 'Good Match',
        source: job.job_publisher || 'Mock Data',
        postedDate: job.job_posted_at_datetime_utc,
        remote: job.job_is_remote || false
      }))

      return NextResponse.json({
        success: true,
        searchQueries: ['Software Engineer', 'Full Stack Developer', 'Backend Developer'],
        matches: mockMatches,
        recommendations: [
          'Consider roles that leverage your existing technical skills',
          'Highlight your experience with modern frameworks in applications',
          'Target companies offering remote work opportunities'
        ],
        totalFound: mockMatches.length,
        parsedResume: {
          skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL'],
          experience: ['Software Engineer', 'Full Stack Developer'],
          yearsExperience: 5
        },
        processingTime: ((Date.now() - startTime) / 1000).toFixed(2),
        usedMockData: true
      })
    }

    // Extract resume text
    console.log(`📄 Processing file: ${resumeFile.name} (${resumeFile.type})`)

    let resumeText = ''

    // Handle different file types
    if (resumeFile.type === 'application/pdf') {
      console.log('📄 Parsing PDF file...')
      try {
        const arrayBuffer = await resumeFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const data = await pdf(buffer)
        resumeText = data.text
        console.log(`✅ PDF parsed: ${data.numpages} pages, ${resumeText.length} chars`)
      } catch (error) {
        console.error('❌ PDF parsing failed:', error)
        throw new Error('Failed to parse PDF. Please try a text file or different PDF.')
      }
    } else {
      resumeText = await resumeFile.text()
    }

    console.log(`📝 Resume text length: ${resumeText.length} characters`)
    console.log(`📝 First 200 chars: ${resumeText.substring(0, 200)}...`)

    // STEP 1: Parse resume with AI
    const parsedResume = await parseResumeWithAI(resumeText)

    // STEP 1.5: Quick career assessment (identify optimal role pivots)
    const suggestedRoles = await quickCareerAssessment(parsedResume)
    console.log(`💼 Career assessment complete: ${suggestedRoles.length} role suggestions`)

    // STEP 2: Generate search queries (using career assessment)
    const searchQueries = await generateSearchQueries(parsedResume, suggestedRoles)

    // STEP 3: AI searches the web for jobs (AI-ONLY, no external APIs)
    const searchResult = await searchJobsViaAI(searchQueries)
    const { jobs: rawJobs, usedMockData } = searchResult

    // =========================================================================
    // OPTIMIZATION: Skip expensive AI operations when using mock data
    // This prevents 504 timeouts by avoiding 5-10 seconds of AI matching
    // =========================================================================
    if (usedMockData) {
      console.log('⚡ FAST PATH: Returning pre-formatted mock data to avoid timeout')

      const mockMatches = rawJobs.map((job, index) => ({
        id: job.job_id,
        title: job.job_title,
        company: job.employer_name,
        location: job.job_city && job.job_state
          ? `${job.job_city}, ${job.job_state}`
          : job.job_country || 'Remote',
        description: job.job_description,
        salary: job.job_min_salary && job.job_max_salary
          ? `$${job.job_min_salary.toLocaleString()}-$${job.job_max_salary.toLocaleString()}`
          : undefined,
        url: job.job_apply_link,
        matchScore: 92 - (index * 4), // Descending scores: 92, 88, 84, 80, 76
        matchingSkills: parsedResume.skills.slice(0, 5),
        missingSkills: ['Docker', 'Kubernetes'],
        recommendation: index === 0 ? 'Excellent Match' : index === 1 ? 'Strong Match' : 'Good Match',
        source: job.job_publisher || 'Mock Data',
        postedDate: job.job_posted_at_datetime_utc,
        remote: job.job_is_remote || false
      }))

      const mockRecommendations = [
        'Your skills align well with these positions - focus on highlighting your key technical abilities',
        'Consider tailoring your resume to emphasize relevant project experience',
        'These remote-friendly roles offer strong opportunities for career growth'
      ]

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ AI Job Search (mock data path) completed in ${duration}s\n`)

      return NextResponse.json({
        success: true,
        searchQueries,
        matches: mockMatches,
        recommendations: mockRecommendations,
        totalFound: rawJobs.length,
        parsedResume,
        processingTime: duration,
        usedMockData: true
      })
    }

    // STEP 4: Match and rank jobs (only for real API data)
    const matches = await matchAndRankJobs(parsedResume, rawJobs)

    // STEP 5: Generate recommendations (only for real API data)
    const recommendations = await generateRecommendations(parsedResume, matches)

    // STEP 6 (OPTIONAL): Use recommendations to refine search
    let refinedMatches = matches
    const shouldRefineSearch = matches.length > 0 && recommendations.length > 0 && formData.get('refineSearch') === 'true'

    if (shouldRefineSearch) {
      console.log('🔄 STEP 6: Refining search based on AI recommendations...')

      const refinedQueries = await extractRefinedQueriesFromRecommendations(recommendations, parsedResume)
      console.log(`   Generated ${refinedQueries.length} refined queries:`, refinedQueries)

      if (refinedQueries.length > 0) {
        const refinedSearchResult = await searchJobsViaAI(refinedQueries)
        const refinedRawJobs = refinedSearchResult.jobs
        const refinedJobMatches = await matchAndRankJobs(parsedResume, refinedRawJobs)

        // Merge with existing matches, remove duplicates, and re-sort
        const allMatches = [...matches, ...refinedJobMatches]
        const uniqueMatches = Array.from(new Map(allMatches.map(j => [j.id, j])).values())
        refinedMatches = uniqueMatches.sort((a, b) => b.matchScore - a.matchScore)

        console.log(`✅ Refined search added ${refinedJobMatches.length} new jobs (${refinedMatches.length} total after dedup)`)
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ AI Job Search completed in ${duration}s\n`)

    return NextResponse.json({
      success: true,
      searchQueries,
      matches: refinedMatches, // Use refined matches if search was refined
      recommendations,
      totalFound: rawJobs.length,
      parsedResume,
      processingTime: duration,
      wasRefined: shouldRefineSearch // Flag indicating if search was refined
    })

  } catch (error) {
    console.error('❌ AI Job Search failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'AI job search failed'
      },
      { status: 500 }
    )
  }
}
