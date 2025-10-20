# V2 vs V3 Quick Reference Guide

**Last Updated**: October 12, 2025

---

## 🎯 Quick Decision Matrix

| Your Need | Use This | Why |
|-----------|----------|-----|
| "I want to be a DevOps Engineer" | **V2** | You know your target, need deep analysis |
| "What roles fit my skills?" | **V3** | AI discovers optimal career paths |
| Applying to 2-3 select jobs | **V2** | Deep per-job prep with bridge gaps |
| Exploring 20+ opportunities | **V3** | Cost-effective volume searching |
| Need specific action items per job | **V2** | Bridge gap suggestions per position |
| Want AI to suggest career pivots | **V3** | Early career assessment built-in |
| Budget: $1 per search | **V2** | High-quality deep analysis |
| Budget: $0.04 per search | **V3** | Intelligent but cost-effective |

---

## 📊 Feature Comparison (1-Minute Version)

| Feature | V2 | V3 |
|---------|----|----|
| **URL** | `/resume-jobs` | `/resume-jobs-v3` |
| **Career Pivot Detection** | After search | **Before search** ⭐ |
| **Search Query Focus** | Resume title only | **AI-suggested pivots** ⭐ |
| **Per-Job Detail** | 5-category breakdown | Simple score |
| **Cost** | $0.90/search | $0.04/search |
| **UI Style** | Clean traditional | Modern gradient |
| **Best For** | Known targets | Discovery |

---

## 🚀 How to Use Each Version

### V2: Quick Start

```bash
# 1. Go to URL
http://localhost:3000/resume-jobs

# 2. Upload resume (PDF/DOCX/TXT)

# 3. Optional: Set preferences
- Preferred Role: "DevOps Engineer"
- Location: "Toronto, ON"
- Type: Full-time

# 4. Wait ~30 seconds

# 5. Get results:
- Resume analysis
- ✨ Career recommendations (purple card)
- Scored jobs (click for details)
```

**What You'll See**:
- Match score breakdown (5 categories)
- Strengths: "You have X experience..."
- Concerns: "You may need Y..."
- Bridge Gaps: "Take AWS cert, build Terraform projects..."

---

### V3: Quick Start

```bash
# 1. Go to URL
http://localhost:3000/resume-jobs-v3

# 2. Upload resume (PDF/TXT)

# 3. Enable refined search (checkbox) ✅ Recommended

# 4. Click "Let AI Find My Jobs"

# 5. Wait ~15 seconds

# 6. Get results:
- AI Generated Searches (pivot-focused!)
- ✨ Career recommendations (purple card)
- Job matches (click for details)
```

**What You'll See**:
- Searches like: "DevOps Engineer Azure Python" (not "IT Manager")
- Recommendations: "Pivot to DevOps/SRE roles"
- Match scores with quick summaries

---

## 🔍 Example Search Comparison

### Input Resume
```
Title: Senior IT Manager
Skills: Azure, VMware, PowerShell, Python, GitHub Actions
Experience: 10 years
```

### V2 Output (Traditional)
```
Search Queries:
❌ "Senior IT Manager cloud Azure AWS"
❌ "IT Director cybersecurity infrastructure"
❌ "Cloud Infrastructure Manager VMware"

Career Recommendations:
"Consider pivoting to DevOps Engineer or Cloud Architect
roles where your technical + management skills create value"

Jobs Found: 15 (mostly management roles)
Average Match: 65%
```

---

### V3 Output (AI-First)
```
Career Assessment (runs FIRST):
→ DevOps Engineer
→ Cloud Architect
→ Site Reliability Engineer
→ Infrastructure Engineer

Search Queries (using assessment):
✅ "DevOps Engineer Azure Python automation"
✅ "Cloud Architect migration VMware"
✅ "Site Reliability Engineer monitoring"
✅ "Infrastructure Engineer CI/CD pipelines"

Career Recommendations:
"Your profile strongly aligns with DevOps/SRE roles.
Target these instead of pure management positions"

Jobs Found: 30 (pivot-focused roles)
Average Match: 82%
```

**Result**: V3 finds better-fit roles automatically! 🎉

---

## 💰 Cost Breakdown (Real Numbers)

### V2: High Quality, Higher Cost

```
Per Search (20 jobs):
- Resume parsing:        $0.006
- Career assessment:     $0.002
- Job scoring (20×):     $0.900  ← Most expensive
- Career recs:           $0.002
─────────────────────────────
Total:                   $0.910

With 24h cache:          $0.002 (repeat searches)
Effective cost:          $0.045-0.90 per search
```

---

### V3: Smart & Cost-Effective

```
Per Search (30 jobs):
- Resume parsing:        $0.006
- Career assessment:     $0.0006 ← Quick & cheap
- Query generation:      $0.0015
- Job matching (30×):    $0.027  ← Lightweight
- Career recs:           $0.0018
- Refined search:        $0.0009 (optional)
─────────────────────────────
Total:                   $0.039

With 24h cache:          $0.002 (repeat searches)
Effective cost:          $0.010-0.039 per search
```

**Savings**: 95.7% cheaper than V2! 💵

---

## 🎨 UI Differences

### V2 Look & Feel
```
✓ Clean, professional
✓ Traditional white backgrounds
✓ Blue/green accent colors
✓ Standard form controls
✓ Step-by-step progress bars
✓ Enhanced with purple gradient cards (career recs)
```

### V3 Look & Feel
```
✓ Modern gradient backgrounds (purple-to-blue)
✓ Dark mode toggle 🌙
✓ Animated icons (Brain, Sparkles, Loader)
✓ Hover scale effects
✓ Purple theme throughout
✓ Toast notifications
✓ Lucide React icons
```

---

## 🛠️ Technical Stack

### Shared Components
- Framework: Next.js 14
- AI: Claude Sonnet 4.5
- Database: Supabase
- Styling: Tailwind CSS
- File Parsing: pdf-parse, mammoth

### V2 Specific
- Job Search: Free services + RapidAPI
- Scoring: ai-job-scorer.ts (deep)
- Preferences: User-controlled

### V3 Specific
- Job Search: JSearch API
- Icons: lucide-react
- Matching: Lightweight scoring
- Assessment: quickCareerAssessment()

---

## 📝 API Endpoints

### V2 Endpoint
```typescript
POST /api/resume-job-search

Request:
- resume: File (PDF/DOCX/TXT)
- preferences: JSON {
    preferredRole: string
    preferredLocation: string
    employmentType: string
    remoteOnly: boolean
  }

Response:
- analysis: Resume parsing results
- matches: Array of deeply scored jobs
- recommendations: Career-level advice
- searchKeywords: Used query
```

### V3 Endpoint
```typescript
POST /api/ai-job-search

Request:
- resume: File (PDF/TXT)
- refineSearch: 'true' | 'false'

Response:
- searchQueries: AI-generated (pivot-focused)
- matches: Array of lightweight scored jobs
- recommendations: Career-level advice
- parsedResume: Extracted data
- wasRefined: boolean
```

---

## 🐛 Common Issues & Fixes

### "Search queries don't reflect my pivot"

**Problem**: V3 showing generic queries

**Check**:
```bash
# Terminal should show:
✅ Career assessment suggests: DevOps Engineer, Cloud Architect...
🔍 Suggested roles: DevOps Engineer, Cloud Architect...

# If missing, check:
echo $ANTHROPIC_API_KEY  # Must be set
echo $AI_DEFAULT_MODEL   # Must be claude-sonnet-4-5-20250929
```

---

### "404 on job details page"

**Problem**: Click job → 404 error

**Fix**: Clear sessionStorage
```javascript
// In browser console:
sessionStorage.clear()
// Reload page and search again
```

---

### "High API costs"

**Problem**: Bills higher than expected

**Check cache**:
```sql
-- In Supabase SQL editor:
SELECT cache_key, COUNT(*) as hits
FROM ai_responses
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY cache_key;

-- Should see cache hits > 0
```

**Fix**: Verify Supabase connection in `.env`

---

## 📈 Performance Metrics

### V2 Performance
```
Average Search Time:     ~30 seconds
Jobs Analyzed:           15-20
Cache Hit Rate:          ~60%
API Calls Per Search:    22-25
Cost Per Search:         $0.90 (first) / $0.002 (cached)
```

### V3 Performance
```
Average Search Time:     ~15 seconds  ⚡ 2× faster
Jobs Analyzed:           25-35
Cache Hit Rate:          ~70%
API Calls Per Search:    8-12
Cost Per Search:         $0.04 (first) / $0.002 (cached)
```

---

## 🎓 When to Recommend to Users

### Recommend V2 If User Says:
- "I want to apply for Senior DevOps roles"
- "I need to understand why I'm not a good fit"
- "What specific skills do I need for this job?"
- "How do I bridge my experience gap?"
- "I'm targeting 3 companies specifically"

### Recommend V3 If User Says:
- "I'm not sure what I should be applying for"
- "What roles match my background?"
- "I want to explore different career paths"
- "My current job title doesn't reflect my skills"
- "I need to search broadly and see options"

---

## ⚡ Power User Tips

### Best Practice: Use Both!

**Step 1**: Start with V3 (Discovery)
```bash
1. Upload resume to /resume-jobs-v3
2. Review AI career recommendations
3. Note the pivot roles suggested
4. See which jobs have highest match scores
5. Identify 3-5 top opportunities
```

**Step 2**: Deep dive with V2 (Analysis)
```bash
1. Go to /resume-jobs
2. Upload same resume
3. Set "Preferred Role" to one of V3's pivots
   (e.g., "DevOps Engineer")
4. Get deep analysis of those specific jobs
5. Review bridge gap action items
6. Prep applications with specific details
```

**Result**: Discovery + Deep Analysis = Perfect Combo! 🎯

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `V2_V3_COMPLETE_DOCUMENTATION.md` | Full technical guide |
| `V2_V3_QUICK_REFERENCE.md` | This file - quick answers |
| `AI_MODEL_SELECTION_GUIDE.md` | When to use Claude vs GPT |
| `AI_VS_SCRAPING_COMPARISON.md` | Why hybrid approach |
| `TROUBLESHOOTING_AI_SEARCH.md` | Debug PDF parsing issues |

---

## 🚦 Status & Next Steps

### Current Status: ✅ Both Production Ready

**V2 Complete**:
- ✅ Deep job scoring
- ✅ Career recommendations added (Oct 12)
- ✅ Enhanced UI progress display
- ✅ PDF/DOCX parsing
- ✅ Premium features integrated

**V3 Complete**:
- ✅ Early career assessment (Oct 12)
- ✅ Pivot-focused queries
- ✅ Refined search option
- ✅ Modern gradient UI
- ✅ Dark mode support

### Coming Soon:

**V2 Roadmap**:
- [ ] Interview prep per job
- [ ] Email alerts for saved searches
- [ ] Job comparison tool

**V3 Roadmap**:
- [ ] ML-based pivot predictions
- [ ] LinkedIn integration
- [ ] Salary insights per match

---

## 🤝 Support

**Issues?** Check:
1. Terminal logs (detailed debug info)
2. Browser console (client errors)
3. `.env` file (API keys)
4. Supabase dashboard (database)

**Questions?** Refer to:
- `V2_V3_COMPLETE_DOCUMENTATION.md` (comprehensive)
- This file (quick answers)

---

**Quick Reference Version**: 1.0
**For Full Details**: See `V2_V3_COMPLETE_DOCUMENTATION.md`
**Last Updated**: October 12, 2025
