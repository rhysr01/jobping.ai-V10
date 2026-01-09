#!/usr/bin/env tsx
/**
 * Simple AI Reliability Test
 * Core testing - no fluff, just essential reliability checks
 */

import { AIMatchingService } from "../Utils/matching/ai-matching.service";
import { aiMonitor } from "../Utils/monitoring/ai-monitor";
import type { Job } from "../scrapers/types";
import type { NormalizedUserProfile } from "../Utils/matching/types";

const SAMPLE_JOBS: Job[] = [
  {
    id: 1,
    job_hash: "test-job-1",
    title: "Software Engineer",
    company: "Tech Corp",
    location: "London, UK",
    city: "London",
    country: "UK",
    job_url: "https://example.com/job1",
    description: "Software engineering role for graduates",
    experience_required: "entry-level",
    work_environment: "hybrid",
    source: "test",
    categories: ["early-career", "tech"],
    company_profile_url: "",
    language_requirements: ["English"],
    scrape_timestamp: new Date().toISOString(),
    original_posted_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    posted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    last_seen_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const SAMPLE_USER_PROFILE: NormalizedUserProfile = {
  email: "test@example.com",
  career_path: ["tech"],
  target_cities: ["London"],
  professional_expertise: "software development",
  work_environment: "hybrid",
  visa_status: "eu-citizen",
  entry_level_preference: "entry",
  full_name: "Test User",
  start_date: new Date().toISOString().split('T')[0],
  languages_spoken: ["English"],
  company_types: ["tech"],
  roles_selected: ["software-engineer"],
  skills: ["JavaScript", "React"],
};

async function simpleAIReliabilityTest() {
  console.log("🧪 Simple AI Reliability Test\n");

  const hasAPIKey = process.env.OPENAI_API_KEY;
  if (!hasAPIKey) {
    console.log("❌ OPENAI_API_KEY not found - cannot test real AI");
    console.log("💡 Run: export OPENAI_API_KEY='your-key-here'");
    process.exit(1);
  }

  try {
    const aiService = new AIMatchingService();

    // Test 1: Basic connection
    console.log("1️⃣  Testing connection...");
    const connected = await aiService.testConnection();
    if (!connected) {
      console.log("❌ AI connection failed");
      process.exit(1);
    }
    console.log("✅ AI connected");

    // Test 2: Basic matching (run 3 times)
    console.log("\n2️⃣  Testing matching consistency...");
    const results = [];
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      const matches = await aiService.performEnhancedAIMatching(
        SAMPLE_JOBS,
        SAMPLE_USER_PROFILE
      );
      const duration = Date.now() - start;
      results.push({ matches: matches.length, duration });

      console.log(`   Run ${i + 1}: ${matches.length} matches in ${duration}ms`);
    }

    // Test 3: Check consistency
    const matchCounts = results.map(r => r.matches);
    const avgMatches = matchCounts.reduce((a, b) => a + b, 0) / matchCounts.length;
    const consistency = matchCounts.every(count => count === avgMatches);

    console.log(`\n📊 Results:`);
    console.log(`   Average matches: ${avgMatches}`);
    console.log(`   Consistent results: ${consistency ? '✅' : '⚠️'}`);

    // Test 4: Performance check
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const performanceOK = avgDuration < 10000; // 10 seconds max

    console.log(`   Average response time: ${avgDuration.toFixed(0)}ms`);
    console.log(`   Performance acceptable: ${performanceOK ? '✅' : '❌'}`);

    // Final verdict
    const allGood = connected && consistency && performanceOK;

    console.log(`\n🎯 Final Result: ${allGood ? '✅ AI WORKING' : '❌ ISSUES FOUND'}`);

    if (allGood) {
      console.log("🚀 AI is reliable and ready for production!");
    } else {
      console.log("⚠️  Check the issues above before deploying.");
    }

    process.exit(allGood ? 0 : 1);

  } catch (error) {
    console.error("💥 Test failed:", error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
}

if (require.main === module) {
  simpleAIReliabilityTest();
}