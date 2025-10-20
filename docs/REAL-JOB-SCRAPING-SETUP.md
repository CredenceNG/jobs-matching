# 🌐 Real Job Scraping Setup Guide

Your JobAI system is now configured to scrape **REAL jobs from the internet** using multiple job board APIs. No more test data!

## 🚀 Quick Setup (Choose One)

### Option 1: JSearch via RapidAPI (Recommended - Free Tier)

1. **Visit**: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
2. **Sign Up**: Create free RapidAPI account
3. **Subscribe**: Choose "Basic" plan (FREE - 2,500 requests/month)
4. **Copy API Key**: Go to "Endpoints" → Copy your `X-RapidAPI-Key`
5. **Add to .env.local**:
   ```bash
   RAPIDAPI_KEY=your-actual-rapidapi-key-here
   ```

### Option 2: Adzuna API (Alternative)

1. **Visit**: https://developer.adzuna.com/
2. **Register**: Free developer account
3. **Get Credentials**: App ID and App Key
4. **Add to .env.local**:
   ```bash
   ADZUNA_APP_ID=your-app-id-here
   ADZUNA_APP_KEY=your-app-key-here
   ```

## 🔥 What Happens Now

Once you add **ANY** of the above API keys:

1. **Real Job Scraping**: System scrapes live job postings from major job boards
2. **AI Analysis**: Claude AI analyzes each REAL job against user profile
3. **Smart Matching**: Provides detailed match scores and reasoning
4. **No Fallbacks**: Zero test data - only real jobs from the internet

## 🧪 Test Real Job Scraping

1. **Add API key** to `.env.local`
2. **Start dev server**: `npm run dev`
3. **Visit**: http://localhost:3000/anonymous-jobs
4. **Fill profile** with real skills (e.g., "React Developer", skills: "JavaScript, React, Node.js")
5. **Click "Find Matches"** → System will:
   - 🌐 Scrape real jobs from job boards
   - 🤖 Analyze with Claude AI
   - 📊 Show match scores and reasoning

## 🎯 Current Job Sources

- **JSearch**: Aggregates from Indeed, LinkedIn, ZipRecruiter, Glassdoor, etc.
- **Adzuna**: Major job boards worldwide
- **No Mock Data**: System throws errors if no API keys (forces real data)

## 🛠️ Technical Details

**Files Updated:**

- `src/app/anonymous-jobs/page.tsx` → Now uses JobSearchService for real scraping
- `src/lib/services/job-search.ts` → JSearch + Adzuna integration (no fallbacks)
- System will show clear error if API keys missing

**Error Handling:**

- Missing API keys → Clear error message with setup instructions
- No jobs found → Suggests different search terms
- AI API fails → Shows which API keys are missing

Ready to scrape the real internet for jobs! 🚀
