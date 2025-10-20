/**
 * Resume Parser Service
 * Uses AI to extract structured information from resume text
 */

import {
  getAIService,
  isAIServiceAvailable,
} from "@/lib/ai/request-scoped-service";

interface ParsedResumeData {
  skills: string[];
  experience: string;
  location?: string;
  jobTitles: string[];
  industries: string[];
  education?: string;
  certifications?: string[];
  summary?: string;
}

export class ResumeParserService {
  /**
   * Parse resume text using AI when available, fallback to basic analysis
   */
  async parseResumeText(resumeText: string): Promise<ParsedResumeData> {
    try {
      // Try AI analysis first if available
      if (isAIServiceAvailable()) {
        console.log("🤖 Using AI-Enhanced Resume Analysis...");
        return await this.aiEnhancedParsing(resumeText);
      } else {
        console.log("⚡ AI service unavailable, using basic text analysis...");
        return this.basicTextAnalysis(resumeText);
      }
    } catch (error) {
      console.error("❌ Resume parsing error:", error);
      console.log("🔄 Falling back to basic text analysis...");
      return this.basicTextAnalysis(resumeText);
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
`;

    try {
      const aiService = getAIService();
      const response = await aiService.makeRequest<string>(
        "anonymous-user", // userId
        "resume_parsing" as any, // feature
        analysisPrompt, // prompt
        {
          maxTokens: 1000,
          temperature: 0.1,
        }
      );

      // Parse the AI response
      if (!response.success || !response.data) {
        throw new Error("AI request failed: " + response.error);
      }

      const parsedData: ParsedResumeData = JSON.parse(response.data);
      return this.validateParsedData(parsedData);
    } catch (error) {
      console.error("AI parsing error:", error);
      throw error; // Re-throw to be caught by parent method
    }
  }

  /**
   * Generate job search keywords from parsed resume data
   */
  generateJobSearchKeywords(parsedData: ParsedResumeData): string {
    const keywords: string[] = [];

    // Add primary skills
    if (parsedData.skills && parsedData.skills.length > 0) {
      keywords.push(...parsedData.skills.slice(0, 5)); // Top 5 skills
    }

    // Add job titles
    if (parsedData.jobTitles && parsedData.jobTitles.length > 0) {
      keywords.push(...parsedData.jobTitles.slice(0, 2)); // Top 2 job titles
    }

    // Add industries
    if (parsedData.industries && parsedData.industries.length > 0) {
      keywords.push(parsedData.industries[0]); // Primary industry
    }

    return keywords.join(" ");
  }

  /**
   * Generate location for job search
   */
  generateJobSearchLocation(parsedData: ParsedResumeData): string {
    if (parsedData.location) {
      return parsedData.location;
    }

    // Default to remote if no location specified
    return "Remote";
  }

  /**
   * Validate and clean parsed data
   */
  private validateParsedData(data: any): ParsedResumeData {
    return {
      skills: Array.isArray(data.skills) ? data.skills.filter(Boolean) : [],
      experience:
        typeof data.experience === "string" ? data.experience : "mid-level",
      location: typeof data.location === "string" ? data.location : undefined,
      jobTitles: Array.isArray(data.jobTitles)
        ? data.jobTitles.filter(Boolean)
        : [],
      industries: Array.isArray(data.industries)
        ? data.industries.filter(Boolean)
        : [],
      education:
        typeof data.education === "string" ? data.education : undefined,
      certifications: Array.isArray(data.certifications)
        ? data.certifications.filter(Boolean)
        : [],
      summary: typeof data.summary === "string" ? data.summary : undefined,
    };
  }

  /**
   * Basic text analysis fallback when AI is not available
   */
  public basicTextAnalysis(resumeText: string): ParsedResumeData {
    const text = resumeText.toLowerCase();
    const originalText = resumeText;
    const skills: string[] = [];
    const jobTitles: string[] = [];
    const industries: string[] = [];

    // Extract common technical skills
    const techSkills = [
      "JavaScript",
      "TypeScript",
      "Python",
      "Java",
      "C++",
      "C#",
      "PHP",
      "Ruby",
      "Go",
      "Rust",
      "React",
      "Vue",
      "Angular",
      "Node.js",
      "Express",
      "Django",
      "Flask",
      "Spring",
      "Laravel",
      "HTML",
      "CSS",
      "Sass",
      "Bootstrap",
      "Tailwind",
      "MongoDB",
      "PostgreSQL",
      "MySQL",
      "Redis",
      "SQLite",
      "AWS",
      "Azure",
      "GCP",
      "Docker",
      "Kubernetes",
      "Jenkins",
      "Git",
      "GitHub",
      "GitLab",
      "Jira",
      "Slack",
      "REST",
      "GraphQL",
      "API",
      "Microservices",
      "DevOps",
      "Machine Learning",
      "AI",
      "Data Science",
      "Analytics",
    ];

    // Marketing & Business Skills
    const marketingSkills = [
      "SEO",
      "SEM",
      "Google Analytics",
      "Social Media Marketing",
      "Content Marketing",
      "Email Marketing",
      "Brand Management",
      "Digital Marketing",
      "Marketing Strategy",
      "Campaign Management",
      "Copywriting",
      "Content Creation",
      "Market Research",
      "Brand Strategy",
      "Product Marketing",
      "Growth Marketing",
      "Performance Marketing",
      "Marketing Automation",
      "HubSpot",
      "Salesforce",
      "Facebook Ads",
      "Google Ads",
      "Instagram Marketing",
      "LinkedIn Marketing",
      "Twitter Marketing",
      "TikTok Marketing",
      "Influencer Marketing",
      "Public Relations",
      "PR",
      "Media Relations",
      "Crisis Management",
      "Event Marketing",
      "Trade Shows",
      "B2B Marketing",
      "B2C Marketing",
      "Customer Acquisition",
      "Lead Generation",
      "Conversion Optimization",
      "A/B Testing",
      "Marketing ROI",
      "Attribution Modeling",
    ];

    // Sales Skills
    const salesSkills = [
      "Sales",
      "Business Development",
      "Account Management",
      "Client Relations",
      "Customer Success",
      "Sales Strategy",
      "Negotiation",
      "Lead Qualification",
      "Pipeline Management",
      "CRM",
      "Salesforce CRM",
      "Cold Calling",
      "Prospecting",
      "Sales Forecasting",
      "Territory Management",
      "Enterprise Sales",
      "B2B Sales",
      "SaaS Sales",
      "Inside Sales",
      "Outside Sales",
      "Sales Operations",
      "Revenue Operations",
      "Deal Closing",
      "Relationship Building",
    ];

    // HR & Recruitment Skills
    const hrSkills = [
      "Recruiting",
      "Talent Acquisition",
      "HR Management",
      "Employee Relations",
      "Onboarding",
      "Performance Management",
      "Compensation",
      "Benefits Administration",
      "HRIS",
      "Workday",
      "ADP",
      "Talent Management",
      "Succession Planning",
      "Training",
      "Learning & Development",
      "Employee Engagement",
      "Diversity & Inclusion",
      "Labor Relations",
      "HR Compliance",
      "Payroll",
    ];

    // Design & Creative Skills
    const designSkills = [
      "Graphic Design",
      "UI Design",
      "UX Design",
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Adobe InDesign",
      "Figma",
      "Sketch",
      "Canva",
      "Video Editing",
      "Adobe Premiere",
      "Final Cut Pro",
      "Motion Graphics",
      "After Effects",
      "Brand Design",
      "Web Design",
      "Typography",
      "Color Theory",
      "Visual Design",
      "Illustration",
      "Photography",
      "3D Design",
      "Blender",
      "CAD",
    ];

    // Finance & Accounting Skills
    const financeSkills = [
      "Accounting",
      "Financial Analysis",
      "Budgeting",
      "Forecasting",
      "Financial Modeling",
      "Excel",
      "QuickBooks",
      "SAP",
      "Oracle",
      "Tax Preparation",
      "Audit",
      "Financial Reporting",
      "GAAP",
      "IFRS",
      "FP&A",
      "Investment Analysis",
      "Risk Management",
      "Treasury",
      "Accounts Payable",
      "Accounts Receivable",
      "Bookkeeping",
    ];

    // Extract soft skills
    const softSkills = [
      "Leadership",
      "Communication",
      "Team Management",
      "Project Management",
      "Problem Solving",
      "Critical Thinking",
      "Collaboration",
      "Agile",
      "Scrum",
      "Strategic Planning",
      "Time Management",
      "Organization",
      "Presentation",
      "Public Speaking",
      "Written Communication",
      "Interpersonal Skills",
      "Conflict Resolution",
      "Mentoring",
      "Coaching",
    ];

    // Check for ALL skills across all categories
    const allSkills = [
      ...techSkills,
      ...marketingSkills,
      ...salesSkills,
      ...hrSkills,
      ...designSkills,
      ...financeSkills,
      ...softSkills,
    ];

    allSkills.forEach((skill) => {
      if (text.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });

    // Extract job titles - COMPREHENSIVE list covering all professions
    const commonJobTitles = [
      // Technical Roles
      "Software Developer",
      "Software Engineer",
      "Full Stack Developer",
      "Frontend Developer",
      "Backend Developer",
      "Data Scientist",
      "Data Engineer",
      "DevOps Engineer",
      "Machine Learning Engineer",
      "Technical Lead",
      "Engineering Manager",
      "UI/UX Designer",
      "Designer",
      "Architect",
      // Marketing Roles
      "Marketing Manager",
      "Marketing Director",
      "Digital Marketing Manager",
      "Content Manager",
      "Social Media Manager",
      "Brand Manager",
      "Product Marketing Manager",
      "Growth Manager",
      "SEO Specialist",
      "Marketing Analyst",
      "Marketing Coordinator",
      "Campaign Manager",
      "Communications Manager",
      "Public Relations Manager",
      "PR Manager",
      "Content Strategist",
      "Community Manager",
      // Sales & Business Development
      "Sales Manager",
      "Account Executive",
      "Business Development Manager",
      "Sales Representative",
      "Account Manager",
      "Customer Success Manager",
      "Sales Director",
      "VP of Sales",
      "Sales Operations Manager",
      // HR & Recruitment
      "HR Manager",
      "Recruiter",
      "Talent Acquisition Manager",
      "HR Business Partner",
      "HR Director",
      "People Operations Manager",
      "Compensation Analyst",
      // Finance & Accounting
      "Accountant",
      "Financial Analyst",
      "Controller",
      "CFO",
      "Finance Manager",
      "Bookkeeper",
      "Tax Accountant",
      // Management & Operations
      "Product Manager",
      "Project Manager",
      "Operations Manager",
      "General Manager",
      "Program Manager",
      "Strategy Manager",
      "Consultant",
      "Analyst",
      "Business Analyst",
      "Operations Analyst",
    ];

    commonJobTitles.forEach((title) => {
      if (text.includes(title.toLowerCase())) {
        jobTitles.push(title);
      }
    });

    // Extract industries/sectors - COMPREHENSIVE list
    const commonIndustries = [
      // Tech & Digital
      "Technology",
      "Software",
      "SaaS",
      "Cloud",
      "Mobile",
      "AI/ML",
      "Cybersecurity",
      // Business Services
      "Fintech",
      "Finance",
      "Banking",
      "Insurance",
      "Consulting",
      "Professional Services",
      "Legal",
      "Accounting",
      // Healthcare & Life Sciences
      "Healthcare",
      "Medical",
      "Pharmaceutical",
      "Biotechnology",
      "Health Tech",
      // Retail & E-commerce
      "E-commerce",
      "Retail",
      "Consumer Goods",
      "Fashion",
      "Luxury",
      // Media & Entertainment
      "Media",
      "Entertainment",
      "Publishing",
      "Advertising",
      "Marketing",
      "PR",
      "Digital Media",
      // Education
      "Education",
      "EdTech",
      "Training",
      // Other
      "Startup",
      "Enterprise",
      "Non-profit",
      "Government",
      "Manufacturing",
      "Real Estate",
      "Hospitality",
      "Travel",
      "Transportation",
      "Logistics",
      "Energy",
      "Telecommunications",
    ];

    commonIndustries.forEach((industry) => {
      if (text.includes(industry.toLowerCase())) {
        industries.push(industry);
      }
    });

    // Determine experience level
    let experience = "mid-level";
    if (
      text.includes("senior") ||
      text.includes("lead") ||
      text.includes("manager") ||
      text.includes("principal")
    ) {
      experience = "senior";
    } else if (
      text.includes("junior") ||
      text.includes("entry") ||
      text.includes("intern") ||
      text.includes("graduate")
    ) {
      experience = "entry-level";
    } else if (
      text.includes("executive") ||
      text.includes("director") ||
      text.includes("vp") ||
      text.includes("chief")
    ) {
      experience = "executive";
    }

    // Extract location - improved patterns
    let location: string | undefined;
    const locationPatterns = [
      /\b(remote|work from home)\b/i,
      /\b([A-Z][a-zA-Z\s]{2,}),\s*([A-Z]{2})\b/g, // City, State format (minimum 3 chars for city)
      /\b([A-Z][a-zA-Z\s]{2,}),\s*([A-Z][a-zA-Z\s]{2,})\b/g, // City, Country format
    ];

    for (const pattern of locationPatterns) {
      const matches = originalText.match(pattern);
      if (matches && matches[0] && matches[0].length > 5) {
        // Require longer matches
        // Additional validation to ensure it's a real location
        const locationCandidate = matches[0].trim();
        if (
          !locationCandidate.match(/^[a-z,\s]*$/i) ||
          locationCandidate.includes("  ")
        ) {
          continue; // Skip if contains only lowercase or multiple spaces
        }
        location = locationCandidate;
        break;
      }
    }

    // Extract education level
    let education: string | undefined;
    if (text.includes("phd") || text.includes("doctorate")) {
      education = "PhD";
    } else if (
      text.includes("master") ||
      text.includes("mba") ||
      text.includes("ms ") ||
      text.includes("m.s.")
    ) {
      education = "Masters";
    } else if (
      text.includes("bachelor") ||
      text.includes("bs ") ||
      text.includes("b.s.") ||
      text.includes("ba ") ||
      text.includes("b.a.")
    ) {
      education = "Bachelors";
    }

    // Extract certifications (look for common certification patterns)
    const certifications: string[] = [];
    const certPatterns = [
      /AWS Certified/gi,
      /Google Cloud/gi,
      /Azure/gi,
      /PMP/gi,
      /Scrum Master/gi,
      /Agile/gi,
    ];

    certPatterns.forEach((pattern) => {
      const matches = originalText.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          certifications.push(match.trim());
        });
      }
    });

    return {
      skills: Array.from(new Set(skills)), // Remove duplicates
      experience,
      location,
      jobTitles: Array.from(new Set(jobTitles)),
      industries: Array.from(new Set(industries)),
      education,
      certifications: Array.from(new Set(certifications)),
      summary: `${experience} professional with expertise in ${skills
        .slice(0, 3)
        .join(", ")}`,
    };
  }
}

// Export singleton instance
export const resumeParserService = new ResumeParserService();
