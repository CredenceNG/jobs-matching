# Troubleshooting: AI Job Search Generic Queries

## Issue: AI Generates Generic Queries Instead of Resume-Specific Ones

### Symptoms:
```
AI Generated Searches:
"Software Engineer JavaScript React"
"Python Developer 3 years experience"
"Mid-level Full Stack Engineer React Python"
```

Instead of using YOUR actual skills/experience from the resume.

---

## Root Causes & Solutions

### 1. **PDF Not Being Parsed** ✅ FIXED

**Problem:** If you uploaded a PDF, the text wasn't being extracted.

**Solution:** Updated API to use `pdf-parse` library.

**How to verify:**
```bash
# Check server logs when uploading
# You should see:
📄 Processing file: resume.pdf (application/pdf)
📄 Parsing PDF file...
✅ PDF parsed: 2 pages, 3456 chars
📝 First 200 chars: John Doe
Senior Software Engineer...
```

**If you see an error:**
```bash
❌ PDF parsing failed
```

Try these:
1. Make sure PDF isn't password-protected
2. Try a different PDF (some PDFs have complex formatting)
3. Convert PDF to .txt and upload that instead

---

### 2. **Resume Text is Empty or Truncated**

**Problem:** File uploaded but text extraction failed.

**How to check server logs:**
```bash
# In your terminal where you ran `npm run dev`, look for:
📝 Resume text length: 0 characters  # ← BAD
📝 Resume text length: 3456 characters  # ← GOOD
```

**Solutions:**

**A. If length is 0:**
- File might be corrupted
- File might be an image (scanned PDF)
- Try a different file format

**B. If length is very small (<100):**
- Resume might be mostly images
- Try a text-based resume instead

---

### 3. **AI Parsing Failed to Extract Skills**

**Problem:** PDF parsed correctly but AI didn't extract skills.

**How to check logs:**
```bash
# Look for:
✅ Resume parsed successfully:
   Skills: JavaScript, React, Node.js  # ← GOOD
   Skills:   # ← BAD (empty)
```

**Solutions:**

**If skills are empty:**
1. Resume might not have clear skill keywords
2. Try a resume with a "Skills" section
3. Use bullet points for skills

**Good resume format:**
```
SKILLS
Languages: JavaScript, Python, TypeScript
Frontend: React, Vue.js, Angular
Backend: Node.js, Express, Django
```

**Bad resume format** (hard for AI to parse):
```
I have experience with various technologies including but not limited to
web development frameworks and databases.
```

---

### 4. **Using Fallback Queries**

**Problem:** AI query generation failed, so it's using generic fallback.

**How to check logs:**
```bash
# Look for:
❌ Query generation failed: <error>
# Then:
Using fallback queries...
```

**Solutions:**
1. Check ANTHROPIC_API_KEY is set correctly
2. Check AI_DEFAULT_MODEL is set to `claude-sonnet-4-5-20250929`
3. Check API key has credits/quota remaining

---

## How to Debug

### Step 1: Check Your Resume Upload

1. Upload your resume on `/resume-jobs-v3`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for any errors

### Step 2: Check Server Logs

1. In terminal where you ran `npm run dev`
2. Look for these log lines:

```bash
🚀 AI Job Search started
📄 Processing file: YourName_Resume.pdf (application/pdf)
📄 Parsing PDF file...
✅ PDF parsed: 2 pages, 3456 chars
📝 Resume text length: 3456 characters
📝 First 200 chars: John Doe...

📄 Parsing resume with AI...
✅ Resume parsed successfully:
   Skills: JavaScript, React, Node.js, Python
   Experience: Senior Software Engineer, Full Stack Developer
   Years: 6
   Location: San Francisco

🔍 Generating search queries with AI...
   Using resume: 12 skills, 3 roles
✅ Generated 5 queries
```

### Step 3: Check API Response

In browser DevTools Console:
```javascript
// After uploading resume, check the API response
// Look for parsedResume object:
{
  "parsedResume": {
    "skills": ["JavaScript", "React", ...],  // Should have YOUR skills
    "experience": ["Senior Engineer", ...],   // Should have YOUR titles
    "yearsExperience": 6                      // Should match YOUR experience
  }
}
```

---

## Quick Fixes

### Fix 1: Use Text File Instead of PDF

If PDF parsing is giving issues:

1. Open your resume PDF
2. Select All (Ctrl/Cmd + A)
3. Copy (Ctrl/Cmd + C)
4. Create new file: `resume.txt`
5. Paste content
6. Upload `resume.txt` instead

### Fix 2: Check Resume Format

Make sure your resume has:
```
NAME
Contact info

SKILLS
- JavaScript, Python, React, Node.js
- SQL, MongoDB, Redis
- AWS, Docker, Kubernetes

EXPERIENCE
Senior Software Engineer | Company | 2021-Present
- Did impressive thing with React
- Led team using Node.js
```

### Fix 3: Check Environment Variables

```bash
# In .env.local
ANTHROPIC_API_KEY=sk-ant-...  # Must be set
AI_DEFAULT_MODEL=claude-sonnet-4-5-20250929  # Must be this model
```

### Fix 4: Restart Dev Server

Sometimes helps:
```bash
# Kill server (Ctrl+C)
# Clear cache
rm -rf .next
# Restart
npm run dev
```

---

## Testing with Detailed Logs

### Test Script with Logging

Create `test-resume-parsing.js`:
```javascript
const fs = require('fs');

async function testResumeParsing() {
  const formData = new FormData();
  const resumeFile = fs.readFileSync('path/to/your/resume.pdf');
  const blob = new Blob([resumeFile], { type: 'application/pdf' });

  formData.append('resume', blob, 'resume.pdf');

  const response = await fetch('http://localhost:3000/api/ai-job-search', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  console.log('Parsed Resume:', JSON.stringify(data.parsedResume, null, 2));
  console.log('Search Queries:', data.searchQueries);
}

testResumeParsing();
```

---

## Expected vs Actual

### ❌ BAD (Generic Queries):
```json
{
  "searchQueries": [
    "Software Engineer JavaScript",
    "Python Developer",
    "Full Stack Engineer"
  ],
  "parsedResume": {
    "skills": ["JavaScript", "Python"],
    "experience": ["Software Engineer"],
    "yearsExperience": 3
  }
}
```

### ✅ GOOD (Your Actual Resume):
```json
{
  "searchQueries": [
    "Senior Software Engineer React Node.js microservices AWS",
    "Staff Engineer TypeScript PostgreSQL San Francisco",
    "Tech Lead Full Stack Docker Kubernetes remote"
  ],
  "parsedResume": {
    "skills": [
      "React", "Node.js", "TypeScript", "PostgreSQL",
      "AWS", "Docker", "Kubernetes", "GraphQL"
    ],
    "experience": [
      "Senior Software Engineer", "Tech Lead", "Full Stack Developer"
    ],
    "yearsExperience": 6,
    "location": "San Francisco, CA"
  }
}
```

---

## Still Not Working?

### Option 1: Check Server Logs
Share the full log output from your terminal.

### Option 2: Test with Sample Resume
```javascript
// Create test-with-sample.txt
const sampleResume = `
John Doe
Senior Software Engineer
john@email.com

SKILLS
JavaScript, TypeScript, React, Node.js, Python
PostgreSQL, MongoDB, Redis
AWS, Docker, Kubernetes

EXPERIENCE
Senior Software Engineer at TechCorp (2021-Present)
- Built microservices platform
- Led team of 5 engineers

Software Engineer at StartupXYZ (2019-2021)
- Developed web applications
- Implemented CI/CD pipelines
`;

// Upload this and see if it works
```

### Option 3: Enable Debug Mode
```typescript
// In route.ts, add more logging
console.log('FULL RESUME TEXT:', resumeText);
console.log('AI PROMPT:', prompt);
console.log('AI RESPONSE:', response);
```

---

## Prevention Checklist

Before uploading resume:
- [ ] Resume is text-based (not scanned image)
- [ ] Resume has clear "Skills" section
- [ ] Skills are listed as keywords (not paragraphs)
- [ ] Experience section has job titles
- [ ] File is PDF, DOCX, or TXT
- [ ] File size is under 10MB
- [ ] ANTHROPIC_API_KEY is set
- [ ] Dev server is running

---

## Summary

**Most common issue:** PDF wasn't being parsed.

**Fix:** Updated API to properly extract PDF text.

**How to verify:** Check server logs for "✅ PDF parsed" and "Resume text length".

**If still generic:** Likely your resume doesn't have clear skills/experience sections that AI can extract.

**Quick test:** Upload a .txt file with clear sections to rule out PDF parsing issues.
