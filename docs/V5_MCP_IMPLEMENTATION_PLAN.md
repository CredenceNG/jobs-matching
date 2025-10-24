# V5: Claude + MCP Implementation Plan

## 🎯 Vision

V5 uses **Claude with Model Context Protocol (MCP)** to enable intelligent, AI-driven job discovery. Instead of hardcoded scraping or API calls, Claude uses web search tools to find and extract job data intelligently.

---

## 🔍 What is MCP?

**Model Context Protocol (MCP)** is an open standard that enables AI models to:
- Use external tools (web search, databases, APIs)
- Access real-time data
- Perform actions on behalf of users
- Make intelligent decisions about which tools to use

Think of it as giving Claude "hands and eyes" to interact with the web.

---

## 🏗️ V5 Architecture

```
User uploads resume
    ↓
Claude analyzes resume (existing V3/V4 logic)
    ↓
Claude generates intelligent search strategy
    ↓
Claude uses MCP tools to:
  ┌─────────────────────────────────────┐
  │ 1. Web Search (DuckDuckGo MCP)      │
  │    - "software engineer jobs Toronto"│
  │    - "remote react developer jobs"   │
  │                                      │
  │ 2. Content Extraction                │
  │    - Click on promising job links    │
  │    - Extract structured data         │
  │                                      │
  │ 3. Intelligent Filtering             │
  │    - Rank by relevance               │
  │    - Match against resume            │
  └─────────────────────────────────────┘
    ↓
Claude returns ranked jobs with explanations
    ↓
Display results to user
```

---

## 📦 Implementation Options

### Option 1: DuckDuckGo MCP (FREE - Recommended for V5)

**Package:** `@oevortex/ddg_search` or `duckduckgo-mcp-server`

**Pros:**
- ✅ Completely free
- ✅ No API keys required
- ✅ Privacy-friendly
- ✅ Easy setup: `npx -y @oevortex/ddg_search@latest`

**Cons:**
- ❌ Limited to DuckDuckGo results
- ❌ May have lower quality than paid options

**Best For:** V5 launch, free tier users

---

### Option 2: Brave Search MCP (Premium)

**Package:** `@modelcontextprotocol/server-brave-search`

**Pros:**
- ✅ High-quality results
- ✅ Official MCP support
- ✅ Web, images, news, local search

**Cons:**
- ❌ Requires Brave API key

**Best For:** Premium users upgrade path

---

### Option 3: Tavily MCP (Premium)

**Package:** `@mcptools/mcp-tavily`

**Pros:**
- ✅ AI-optimized search
- ✅ Built specifically for LLMs
- ✅ Advanced content extraction

**Cons:**
- ❌ Requires Tavily API key

**Best For:** Maximum accuracy

---

## 🛠️ Technical Implementation

### Step 1: Install MCP Dependencies

```bash
npm install @anthropic-ai/sdk
npm install @modelcontextprotocol/sdk
npm install @oevortex/ddg_search
```

### Step 2: Create MCP Client Wrapper

**File:** `src/lib/mcp/ddg-mcp-client.ts`

```typescript
/**
 * DuckDuckGo MCP Client
 *
 * Connects Claude to DuckDuckGo web search via MCP
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export class DuckDuckGoMCPClient {
  private client: Client;
  private transport: StdioClientTransport;

  async initialize() {
    // Create MCP client
    this.transport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "@oevortex/ddg_search@latest"]
    });

    this.client = new Client({
      name: "jobai-ddg-client",
      version: "1.0.0"
    }, {
      capabilities: {
        tools: {}
      }
    });

    await this.client.connect(this.transport);
  }

  async searchWeb(query: string) {
    const result = await this.client.callTool({
      name: "ddg_search",
      arguments: {
        query,
        max_results: 10
      }
    });

    return result;
  }

  async cleanup() {
    await this.client.close();
  }
}
```

### Step 3: Create V5 API Endpoint

**File:** `src/app/api/ai-job-search-v5/route.ts`

```typescript
/**
 * V5: Claude + MCP Job Search
 *
 * Uses Claude with DuckDuckGo MCP for intelligent job discovery
 */
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { DuckDuckGoMCPClient } from '@/lib/mcp/ddg-mcp-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume') as File;

    // Step 1: Parse resume (existing logic from V3/V4)
    const parsedResume = await parseResume(resumeFile);

    // Step 2: Initialize MCP client
    const mcpClient = new DuckDuckGoMCPClient();
    await mcpClient.initialize();

    // Step 3: Use Claude with MCP tools
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      tools: [
        {
          name: "web_search",
          description: "Search the web for job postings using DuckDuckGo",
          input_schema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for jobs"
              }
            },
            required: ["query"]
          }
        }
      ],
      messages: [
        {
          role: "user",
          content: `
You are a job search expert. Analyze this resume and find relevant job postings.

Resume:
${JSON.stringify(parsedResume, null, 2)}

Task:
1. Generate 3-5 intelligent job search queries based on the resume
2. Use the web_search tool to find jobs for each query
3. Extract job titles, companies, locations, and links
4. Rank the jobs by relevance to the resume
5. Return the top 20 matches

Format your response as JSON with this structure:
{
  "searches_performed": ["query1", "query2"],
  "jobs": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "Location",
      "url": "https://...",
      "match_score": 95,
      "match_reason": "Why this job matches"
    }
  ]
}
`
        }
      ]
    });

    // Step 4: Handle tool use
    const toolResults = [];

    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === "web_search") {
        const searchResult = await mcpClient.searchWeb(block.input.query);
        toolResults.push(searchResult);
      }
    }

    // Step 5: Get final response from Claude
    const finalResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Here are the search results: ${JSON.stringify(toolResults)}`
        }
      ]
    });

    // Step 6: Cleanup
    await mcpClient.cleanup();

    // Step 7: Return results
    return NextResponse.json({
      success: true,
      jobs: extractJobsFromResponse(finalResponse),
      usedMockData: false
    });

  } catch (error) {
    console.error('V5 MCP error:', error);
    return NextResponse.json({
      success: false,
      error: 'Job search failed'
    }, { status: 500 });
  }
}
```

---

## 🎨 V5 Page

Copy V4 page, update to call `/api/ai-job-search-v5`:

```bash
cp -r src/app/resume-jobs-v4 src/app/resume-jobs-v5
```

Update:
- API endpoint to `/api/ai-job-search-v5`
- Page title to "V5: AI-Driven Discovery"
- Description to highlight MCP intelligence

---

## 🏠 Update Home Page Selector

Add V5 card to version selector:

```tsx
{/* V5 - AI + MCP */}
<a href="/resume-jobs-v5" className="group p-6 bg-gradient-to-br from-pink-50 to-red-50 rounded-xl border-2 border-pink-300 hover:border-pink-500 hover:shadow-xl transition-all">
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm font-bold text-pink-700">V5: AI-Driven</span>
    <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Experimental</span>
  </div>
  <h3 className="text-lg font-bold text-gray-900 mb-2">Intelligent Discovery</h3>
  <p className="text-sm text-gray-600 mb-3">Claude uses web search tools to find jobs intelligently</p>
  <div className="text-xs text-gray-500">🧠 AI-Powered • 🌐 Unlimited Sources • 🐌 Slower (20-40s)</div>
</a>
```

---

## 📊 V5 vs Other Versions

| Feature | V3 | V4 | V5 |
|---------|----|----|-----|
| **Method** | API calls | Web scraping | AI + MCP |
| **Speed** | < 5s | 15-25s | 20-40s |
| **Intelligence** | Fixed queries | Fixed selectors | Adaptive AI |
| **Sources** | 3 APIs | 3 scrapers | Unlimited |
| **Adaptability** | Low | Low | **High** |
| **Setup** | None | Puppeteer | MCP tools |
| **Cost** | Free | Free | Free |

---

## 🚧 Implementation Challenges

### Challenge 1: MCP Client in Serverless

**Problem:** MCP clients spawn child processes, which may not work in serverless

**Solution:**
- Use lightweight MCP implementation
- Consider MCP server hosted externally
- Or run MCP as separate service

### Challenge 2: Claude API Calls Cost

**Problem:** Multiple AI calls per search (expensive)

**Solution:**
- Cache search results aggressively
- Limit to 3 searches per resume
- Use GPT-4o-mini for cheaper alternative

### Challenge 3: Slower Response Times

**Problem:** AI + web search = 20-40 seconds

**Solution:**
- Show progress updates to user
- Stream results as they come in
- Set user expectations (marked "Experimental")

---

## 🎯 Success Metrics

**V5 will be considered successful if:**
- ✅ Finds jobs from sources not in V3/V4
- ✅ Provides better match explanations
- ✅ Adapts to different resume types
- ✅ Completes in under 40 seconds
- ✅ Users prefer quality over speed

---

## 📝 Next Steps

1. **Phase 1: Research** ✅ DONE
   - Identified DuckDuckGo MCP
   - Documented architecture

2. **Phase 2: Proof of Concept**
   - Install MCP dependencies
   - Test DuckDuckGo MCP locally
   - Verify Claude can use tools

3. **Phase 3: Implementation**
   - Create MCP client wrapper
   - Build V5 API endpoint
   - Create V5 page

4. **Phase 4: Testing**
   - Test with real resumes
   - Compare results vs V3/V4
   - Optimize performance

5. **Phase 5: Deployment**
   - Add to version selector
   - Deploy to production
   - Monitor usage

---

## 🔮 Future Enhancements

**V5.1: Multi-MCP Support**
- DuckDuckGo for free users
- Brave/Tavily for premium users
- Combine multiple search sources

**V5.2: Puppeteer MCP**
- Let Claude control browser directly
- Navigate complex job sites
- Fill application forms

**V5.3: Job Board APIs via MCP**
- LinkedIn MCP server
- Indeed MCP server
- GitHub Jobs MCP server

---

**Status:** 📋 Design Complete - Ready for Implementation
**Estimated Time:** 4-6 hours
**Priority:** Low (V3 & V4 are working well)
