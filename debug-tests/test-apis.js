#!/usr/bin/env node

/**
 * API Key Test Script
 * Tests all API keys to verify their validity and status
 */

const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function testAnthropicAPI() {
  console.log("\n🤖 Testing Anthropic Claude API...");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("❌ ANTHROPIC_API_KEY not found");
    return false;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hello" }],
      }),
    });

    if (response.ok) {
      console.log("✅ Anthropic API: Working");
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ Anthropic API: ${response.status} - ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Anthropic API: ${error.message}`);
    return false;
  }
}

async function testOpenAI() {
  console.log("\n🤖 Testing OpenAI API...");

  if (!process.env.OPENAI_API_KEY) {
    console.log("❌ OPENAI_API_KEY not found");
    return false;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (response.ok) {
      console.log("✅ OpenAI API: Working");
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ OpenAI API: ${response.status} - ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ OpenAI API: ${error.message}`);
    return false;
  }
}

async function testJSearchAPI() {
  console.log("\n🔍 Testing JSearch API...");

  if (!process.env.RAPIDAPI_KEY) {
    console.log("❌ RAPIDAPI_KEY not found");
    return false;
  }

  try {
    const response = await fetch(
      "https://jsearch.p.rapidapi.com/search?query=test&page=1&num_pages=1",
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      }
    );

    if (response.ok) {
      console.log("✅ JSearch API: Working");
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ JSearch API: ${response.status} - ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ JSearch API: ${error.message}`);
    return false;
  }
}

async function testAdzunaAPI() {
  console.log("\n🔍 Testing Adzuna API...");

  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
    console.log("❌ Adzuna credentials not found");
    return false;
  }

  try {
    const params = new URLSearchParams({
      app_id: process.env.ADZUNA_APP_ID,
      app_key: process.env.ADZUNA_APP_KEY,
      results_per_page: "1",
      what: "developer",
      where: "New York",
      page: "1",
    });

    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`;
    const response = await fetch(url);

    if (response.ok) {
      console.log("✅ Adzuna API: Working");
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ Adzuna API: ${response.status} - ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Adzuna API: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🧪 API Key Testing Started...\n");

  const results = {
    anthropic: await testAnthropicAPI(),
    openai: await testOpenAI(),
    jsearch: await testJSearchAPI(),
    adzuna: await testAdzunaAPI(),
  };

  console.log("\n📊 Summary:");
  console.log("==================");
  console.log(`Anthropic: ${results.anthropic ? "✅" : "❌"}`);
  console.log(`OpenAI: ${results.openai ? "✅" : "❌"}`);
  console.log(`JSearch: ${results.jsearch ? "✅" : "❌"}`);
  console.log(`Adzuna: ${results.adzuna ? "✅" : "❌"}`);

  const workingApis = Object.values(results).filter(Boolean).length;
  console.log(`\n${workingApis}/4 APIs are working properly.`);

  if (workingApis < 4) {
    console.log("\n💡 Recommendations:");
    if (!results.anthropic)
      console.log("- Check your Anthropic API key and billing status");
    if (!results.openai)
      console.log("- Verify OpenAI API key and account limits");
    if (!results.jsearch)
      console.log("- Renew JSearch subscription on RapidAPI");
    if (!results.adzuna)
      console.log("- Verify Adzuna API credentials and usage limits");
  }
}

main().catch(console.error);
