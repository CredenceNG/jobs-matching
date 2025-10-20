# 🚨 CRITICAL DATA RULES - READ FIRST 🚨

## The Problem We Fixed

The system was showing **software engineering jobs to non-software professionals** because:

1. ❌ Resume parser only looked for tech skills (JavaScript, Python, etc.)
2. ❌ It ignored marketing, sales, HR, finance, and other professional skills
3. ❌ Job matching used generic queries instead of resume-specific keywords
4. ❌ System had hardcoded assumptions that all users are developers

## The Solution

### ✅ Comprehensive Resume Parsing

- Now extracts skills from **ALL professions**:
  - Marketing (SEO, Social Media, Content Marketing, etc.)
  - Sales (CRM, Lead Generation, Business Development, etc.)
  - HR (Recruiting, HRIS, Talent Acquisition, etc.)
  - Finance (Accounting, Financial Modeling, Excel, etc.)
  - Design (Photoshop, Figma, UI/UX, etc.)
  - Technical (JavaScript, Python, AWS, etc.)

### ✅ Accurate Job Matching

- Uses **actual resume content** to search for jobs
- Extracts profession-specific keywords
- Matches jobs to the user's **actual** career field

## ABSOLUTE RULES FOR ALL CODE

### 1️⃣ NO HARDCODED DATA

```typescript
// ❌ NEVER DO THIS
const jobs = [{ title: "Software Engineer", company: "Example Corp" }];

// ✅ ALWAYS DO THIS
const jobs = await jobSearchAPI.search(query);
if (!jobs || jobs.length === 0) {
  return []; // Empty array, not fake data
}
```

### 2️⃣ NO MOCK OR FALLBACK DATA

```typescript
// ❌ NEVER DO THIS
catch (error) {
  return mockJobs; // Don't return fake data on error
}

// ✅ ALWAYS DO THIS
catch (error) {
  console.error("API failed:", error);
  return []; // Let UI show empty state
}
```

### 3️⃣ NO TECH-ONLY ASSUMPTIONS

```typescript
// ❌ NEVER DO THIS
const skills = ["JavaScript", "React"]; // Only tech!

// ✅ ALWAYS DO THIS
const allSkills = [
  ...techSkills,
  ...marketingSkills,
  ...salesSkills,
  ...hrSkills,
  ...financeSkills,
  ...designSkills,
];
```

### 4️⃣ PARSE ACTUAL RESUME CONTENT

```typescript
// ❌ NEVER DO THIS
const skills = ["C#", "Go", "AI"]; // Hardcoded default

// ✅ ALWAYS DO THIS
const skills = extractSkillsFromResumeText(resumeText);
// This must work for ALL professions, not just tech
```

### 5️⃣ MATCH JOBS TO RESUME

```typescript
// ❌ NEVER DO THIS
searchJobs("software developer"); // Generic query

// ✅ ALWAYS DO THIS
const keywords = generateKeywordsFromResume(parsedResume);
searchJobs(keywords); // "marketing manager social media SEO"
```

## Files That Must Follow These Rules

### Critical Files:

1. **`src/lib/services/resume-parser.ts`**

   - ✅ Now has comprehensive skill lists for ALL professions
   - Must extract actual skills from resume text
   - Cannot assume user is a developer

2. **`src/lib/services/job-search.ts`**

   - ✅ Must only return real API data
   - No hardcoded job listings
   - No mock/fallback data

3. **`src/app/api/resume-job-search/route.ts`**
   - Must use parsed resume data for job search
   - Cannot use generic queries
   - Must validate data comes from APIs

## Testing Checklist

Before deploying any code, verify:

- [ ] No hardcoded job listings anywhere
- [ ] No mock data in production code paths
- [ ] Resume parser supports non-tech professions
- [ ] Job searches use resume-specific keywords
- [ ] Marketing manager resume returns marketing jobs
- [ ] Sales rep resume returns sales jobs
- [ ] HR recruiter resume returns HR jobs
- [ ] Empty states shown properly (no fake data)

## User Experience Goals

**What users should see:**

- ✅ Jobs that match their actual profession
- ✅ Results relevant to their skills and experience
- ✅ Real job listings from actual companies
- ✅ Accurate match scores based on their resume

**What users should NEVER see:**

- ❌ Software jobs when they're not in software
- ❌ "Example Company" or placeholder data
- ❌ Irrelevant results that waste their time
- ❌ Generic jobs that ignore their profile

## Remember

**Every line of code should ask:**

1. Is this data real (from an API)?
2. Is this data relevant (matched to user's actual resume)?
3. Does this work for ALL professions, not just tech?
4. Would a marketing manager get good results with this code?

If the answer to any question is NO → Fix it before committing.

---

**Updated**: After fixing the hardcoded tech-only resume parser
**Status**: System now properly supports all professions
**Next**: Ensure job matching quality is maintained
