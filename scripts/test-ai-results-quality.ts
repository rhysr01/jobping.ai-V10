#!/usr/bin/env tsx
/**
 * AI Results Quality Testing Suite
 *
 * Tests the QUALITY of AI matching results, not just that results exist.
 * Validates relevance, accuracy, diversity, ranking, and data integrity.
 */

import { AIMatchingService } from "../Utils/matching/ai-matching.service";
import type { Job } from "../scrapers/types";
import type { NormalizedUserProfile } from "../Utils/matching/types";

interface QualityTestResult {
  testName: string;
  score: number; // 0-100
  passed: boolean;
  details: any;
  recommendations?: string[];
}

// Test data with known characteristics
const TEST_JOBS: Job[] = [
  {
    id: 1,
    job_hash: "test-software-eng",
    title: "Junior Software Engineer",
    company: "TechStart Ltd",
    location: "London, UK",
    city: "London",
    country: "UK",
    job_url: "https://example.com/job1",
    description: "Entry-level software engineering position for recent graduates. Experience with React, Node.js, and JavaScript required. Perfect for career changers and bootcamp graduates.",
    experience_required: "entry-level",
    work_environment: "hybrid",
    source: "test",
    categories: ["early-career", "tech"],
    company_profile_url: "",
    language_requirements: ["English"],
    scrape_timestamp: new Date().toISOString(),
    original_posted_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    posted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    last_seen_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    job_hash: "test-data-analyst",
    title: "Data Analyst Intern",
    company: "DataCorp Berlin",
    location: "Berlin, Germany",
    city: "Berlin",
    country: "Germany",
    job_url: "https://example.com/job2",
    description: "6-month internship for business students interested in data analysis. SQL, Excel, and basic Python skills needed. Great opportunity for graduates with quantitative backgrounds.",
    experience_required: "internship",
    work_environment: "office",
    source: "test",
    categories: ["early-career", "data"],
    company_profile_url: "",
    language_requirements: ["English", "German"],
    scrape_timestamp: new Date().toISOString(),
    original_posted_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    posted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    last_seen_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    job_hash: "test-marketing-grad",
    title: "Digital Marketing Graduate",
    company: "GrowthCo Amsterdam",
    location: "Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    job_url: "https://example.com/job3",
    description: "Graduate position in digital marketing for business school graduates. SEO, social media, and Google Analytics experience preferred. Fast-paced startup environment.",
    experience_required: "graduate",
    work_environment: "remote",
    source: "test",
    categories: ["early-career", "marketing"],
    company_profile_url: "",
    language_requirements: ["English", "Dutch"],
    scrape_timestamp: new Date().toISOString(),
    original_posted_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    posted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    last_seen_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    job_hash: "test-senior-manager",
    title: "Senior Product Manager",
    company: "BigCorp London",
    location: "London, UK",
    city: "London",
    country: "UK",
    job_url: "https://example.com/job4",
    description: "Senior product management role requiring 7+ years experience in B2B SaaS. MBA preferred. Lead cross-functional teams and drive product strategy.",
    experience_required: "senior",
    work_environment: "hybrid",
    source: "test",
    categories: ["senior", "product"],
    company_profile_url: "",
    language_requirements: ["English"],
    scrape_timestamp: new Date().toISOString(),
    original_posted_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    posted_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    last_seen_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    job_hash: "test-consultant",
    title: "Business Consultant",
    company: "ConsultingPlus",
    location: "Paris, France",
    city: "Paris",
    country: "France",
    job_url: "https://example.com/job5",
    description: "Strategy consulting role for top-tier business school graduates. Case interviews and analytical skills required. Fast-track to partnership.",
    experience_required: "entry-level",
    work_environment: "office",
    source: "test",
    categories: ["early-career", "consulting"],
    company_profile_url: "",
    language_requirements: ["English", "French"],
    scrape_timestamp: new Date().toISOString(),
    original_posted_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    posted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    last_seen_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const TEST_PROFILES = {
  softwareEngineer: {
    email: "test-software@example.com",
    career_path: ["tech"],
    target_cities: ["London", "Berlin"],
    professional_expertise: "software development",
    work_environment: "hybrid",
    visa_status: "eu-citizen",
    entry_level_preference: "entry",
    full_name: "Test Software Engineer",
    start_date: new Date().toISOString().split('T')[0],
    languages_spoken: ["English"],
    company_types: ["tech"],
    roles_selected: ["software-engineer"],
    skills: ["JavaScript", "React", "Node.js"],
  } as NormalizedUserProfile,

  dataAnalyst: {
    email: "test-data@example.com",
    career_path: ["data"],
    target_cities: ["Berlin", "Amsterdam"],
    professional_expertise: "data analysis",
    work_environment: "office",
    visa_status: "eu-citizen",
    entry_level_preference: "entry",
    full_name: "Test Data Analyst",
    start_date: new Date().toISOString().split('T')[0],
    languages_spoken: ["English", "German"],
    company_types: ["data"],
    roles_selected: ["data-analyst"],
    skills: ["SQL", "Excel", "Python"],
  } as NormalizedUserProfile,

  marketingGrad: {
    email: "test-marketing@example.com",
    career_path: ["marketing"],
    target_cities: ["Amsterdam", "London"],
    professional_expertise: "digital marketing",
    work_environment: "remote",
    visa_status: "eu-citizen",
    entry_level_preference: "entry",
    full_name: "Test Marketing Grad",
    start_date: new Date().toISOString().split('T')[0],
    languages_spoken: ["English"],
    company_types: ["startup"],
    roles_selected: ["marketing-specialist"],
    skills: ["SEO", "Google Analytics"],
  } as NormalizedUserProfile,
};

class AIResultsQualityTester {
  private aiService: AIMatchingService;
  private testResults: QualityTestResult[] = [];

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY required for result quality testing");
    }
    this.aiService = new AIMatchingService();
  }

  async runComprehensiveQualityTests(): Promise<{
    overallScore: number;
    passedTests: number;
    totalTests: number;
    results: QualityTestResult[];
    recommendations: string[];
  }> {
    console.log("🧪 AI Results Quality Testing Suite\n");
    console.log("=".repeat(60));

    this.testResults = [];

    // Run all quality tests
    await this.testRelevanceAccuracy();
    await this.testExperienceLevelMatching();
    await this.testLocationMatching();
    await this.testLanguageRequirements();
    await this.testResultDiversity();
    await this.testRankingLogic();
    await this.testDataCompleteness();
    await this.testFalsePositiveRate();
    await this.testResultStability();

    // Calculate overall score
    const scores = this.testResults.map(r => r.score);
    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const totalTests = this.testResults.length;

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    // Display results
    this.displayResults(overallScore, passedTests, totalTests, recommendations);

    return {
      overallScore: Math.round(overallScore),
      passedTests,
      totalTests,
      results: this.testResults,
      recommendations
    };
  }

  private async testRelevanceAccuracy(): Promise<void> {
    console.log("🎯 Testing Relevance Accuracy...");

    const profile = TEST_PROFILES.softwareEngineer;
    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, profile);

    // Should match software engineer job highly, not senior manager
    const softwareEngMatch = matches.find(m => m.job_hash === "test-software-eng");
    const seniorManagerMatch = matches.find(m => m.job_hash === "test-senior-manager");

    let score = 50; // Base score
    let passed = false;
    const details: any = {
      matchesFound: matches.length,
      softwareEngScore: softwareEngMatch?.match_score || 0,
      seniorManagerScore: seniorManagerMatch?.match_score || 0,
    };

    if (softwareEngMatch && softwareEngMatch.match_score >= 80) {
      score += 30;
      passed = true;
    }

    if (seniorManagerMatch && seniorManagerMatch.match_score < 30) {
      score += 20; // Good that senior role scored low
    }

    this.testResults.push({
      testName: "Relevance Accuracy",
      score,
      passed,
      details,
      recommendations: score < 70 ? ["AI is not properly distinguishing between entry-level and senior roles"] : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Relevance score: ${score}/100`);
  }

  private async testExperienceLevelMatching(): Promise<void> {
    console.log("📈 Testing Experience Level Matching...");

    const profile = TEST_PROFILES.softwareEngineer; // Entry-level preference
    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, profile);

    // Entry-level user should get high scores for entry-level jobs, low for senior
    const entryLevelMatches = matches.filter(m =>
      TEST_JOBS.find(job => job.job_hash === m.job_hash)?.experience_required === "entry-level"
    );
    const seniorMatches = matches.filter(m =>
      TEST_JOBS.find(job => job.job_hash === m.job_hash)?.experience_required === "senior"
    );

    const avgEntryScore = entryLevelMatches.length > 0
      ? entryLevelMatches.reduce((sum, m) => sum + m.match_score, 0) / entryLevelMatches.length
      : 0;

    const avgSeniorScore = seniorMatches.length > 0
      ? seniorMatches.reduce((sum, m) => sum + m.match_score, 0) / seniorMatches.length
      : 0;

    const passed = avgEntryScore > avgSeniorScore && avgEntryScore > 60;
    const score = passed ? 90 : (avgEntryScore > avgSeniorScore ? 70 : 40);

    this.testResults.push({
      testName: "Experience Level Matching",
      score,
      passed,
      details: {
        avgEntryScore: Math.round(avgEntryScore),
        avgSeniorScore: Math.round(avgSeniorScore),
        entryMatches: entryLevelMatches.length,
        seniorMatches: seniorMatches.length
      },
      recommendations: !passed ? ["Entry-level users getting high scores for senior positions"] : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Experience matching: ${Math.round(avgEntryScore)} (entry) vs ${Math.round(avgSeniorScore)} (senior)`);
  }

  private async testLocationMatching(): Promise<void> {
    console.log("📍 Testing Location Matching...");

    const profile = TEST_PROFILES.softwareEngineer; // Only London + Berlin
    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, profile);

    // Should only match London/Berlin jobs, not Paris
    const londonBerlinMatches = matches.filter(m => {
      const job = TEST_JOBS.find(j => j.job_hash === m.job_hash);
      return job && ["London", "Berlin"].includes(job.city);
    });

    const parisMatches = matches.filter(m => {
      const job = TEST_JOBS.find(j => j.job_hash === m.job_hash);
      return job && job.city === "Paris";
    });

    const passed = londonBerlinMatches.length > 0 && parisMatches.length === 0;
    const score = passed ? 100 : (londonBerlinMatches.length > parisMatches.length ? 80 : 60);

    this.testResults.push({
      testName: "Location Matching",
      score,
      passed,
      details: {
        targetCitiesMatches: londonBerlinMatches.length,
        nonTargetCitiesMatches: parisMatches.length,
        totalMatches: matches.length
      },
      recommendations: !passed ? ["AI matching jobs outside user's target cities"] : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Location matching: ${londonBerlinMatches.length} target cities, ${parisMatches.length} non-target`);
  }

  private async testLanguageRequirements(): Promise<void> {
    console.log("🗣️  Testing Language Requirements...");

    const profile = TEST_PROFILES.dataAnalyst; // English + German
    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, profile);

    // Should get high scores for jobs requiring English/German, lower for French-only
    const englishJobs = matches.filter(m => {
      const job = TEST_JOBS.find(j => j.job_hash === m.job_hash);
      return job && job.language_requirements?.includes("English");
    });

    const frenchOnlyJobs = matches.filter(m => {
      const job = TEST_JOBS.find(j => j.job_hash === m.job_hash);
      return job && job.language_requirements?.includes("French") &&
             !job.language_requirements?.includes("English");
    });

    const avgEnglishScore = englishJobs.length > 0
      ? englishJobs.reduce((sum, m) => sum + m.match_score, 0) / englishJobs.length
      : 0;

    const avgFrenchScore = frenchOnlyJobs.length > 0
      ? frenchOnlyJobs.reduce((sum, m) => sum + m.match_score, 0) / frenchOnlyJobs.length
      : 0;

    const passed = avgEnglishScore > avgFrenchScore || avgFrenchScore < 50;
    const score = passed ? 85 : 60;

    this.testResults.push({
      testName: "Language Requirements",
      score,
      passed,
      details: {
        avgEnglishScore: Math.round(avgEnglishScore),
        avgFrenchScore: Math.round(avgFrenchScore),
        englishJobs: englishJobs.length,
        frenchJobs: frenchOnlyJobs.length
      },
      recommendations: !passed ? ["Language requirements not being properly considered"] : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Language matching: ${Math.round(avgEnglishScore)} (English) vs ${Math.round(avgFrenchScore)} (French-only)`);
  }

  private async testResultDiversity(): Promise<void> {
    console.log("🎲 Testing Result Diversity...");

    const profile = TEST_PROFILES.softwareEngineer;
    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, profile);

    // Check diversity across companies, roles, locations
    const companies = new Set(matches.map(m =>
      TEST_JOBS.find(j => j.job_hash === m.job_hash)?.company
    ).filter(Boolean));

    const locations = new Set(matches.map(m =>
      TEST_JOBS.find(j => j.job_hash === m.job_hash)?.city
    ).filter(Boolean));

    const experienceLevels = new Set(matches.map(m =>
      TEST_JOBS.find(j => j.job_hash === m.job_hash)?.experience_required
    ).filter(Boolean));

    const diversityScore = (companies.size + locations.size + experienceLevels.size) / 3;
    const passed = diversityScore >= 2; // At least 2 different values per category on average
    const score = Math.min(100, diversityScore * 25); // Scale to 0-100

    this.testResults.push({
      testName: "Result Diversity",
      score,
      passed,
      details: {
        uniqueCompanies: companies.size,
        uniqueLocations: locations.size,
        uniqueExperienceLevels: experienceLevels.size,
        diversityScore: diversityScore.toFixed(1)
      },
      recommendations: !passed ? ["Results lack diversity - too similar jobs"] : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Diversity score: ${score}/100 (companies: ${companies.size}, locations: ${locations.size})`);
  }

  private async testRankingLogic(): Promise<void> {
    console.log("📊 Testing Ranking Logic...");

    const profile = TEST_PROFILES.softwareEngineer;
    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, profile);

    // Check if results are properly ranked (highest score first)
    const scores = matches.map(m => m.match_score);
    const isProperlyRanked = scores.every((score, index) =>
      index === 0 || score <= scores[index - 1]
    );

    // Check score distribution - should have reasonable spread
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const scoreSpread = maxScore - minScore;

    const passed = isProperlyRanked && scoreSpread >= 30; // At least 30 point spread
    const score = passed ? 90 : (isProperlyRanked ? 70 : 40);

    this.testResults.push({
      testName: "Ranking Logic",
      score,
      passed,
      details: {
        properlyRanked: isProperlyRanked,
        scoreSpread,
        maxScore,
        minScore,
        topScores: scores.slice(0, 3)
      },
      recommendations: !isProperlyRanked ? ["Results not properly ranked by relevance"] : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Ranking: ${isProperlyRanked ? 'proper' : 'improper'} order, ${scoreSpread} point spread`);
  }

  private async testDataCompleteness(): Promise<void> {
    console.log("📋 Testing Data Completeness...");

    const profile = TEST_PROFILES.softwareEngineer;
    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, profile);

    // Check that all matches have required fields
    const completeMatches = matches.filter(m => {
      const job = TEST_JOBS.find(j => j.job_hash === m.job_hash);
      return job &&
             m.match_score >= 0 &&
             m.match_reason &&
             m.match_reason.length > 10;
    });

    const completenessRatio = completeMatches.length / matches.length;
    const passed = completenessRatio >= 0.9; // 90% complete
    const score = Math.round(completenessRatio * 100);

    this.testResults.push({
      testName: "Data Completeness",
      score,
      passed,
      details: {
        completeMatches: completeMatches.length,
        totalMatches: matches.length,
        completenessRatio: `${Math.round(completenessRatio * 100)}%`
      },
      recommendations: !passed ? ["Some matches missing required data fields"] : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Data completeness: ${Math.round(completenessRatio * 100)}%`);
  }

  private async testFalsePositiveRate(): Promise<void> {
    console.log("🚫 Testing False Positive Rate...");

    const profile = TEST_PROFILES.marketingGrad; // Marketing focus
    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, profile);

    // Marketing user should get high scores for marketing job, low for software/data
    const marketingMatches = matches.filter(m => {
      const job = TEST_JOBS.find(j => j.job_hash === m.job_hash);
      return job && job.categories?.includes("marketing");
    });

    const nonMarketingMatches = matches.filter(m => {
      const job = TEST_JOBS.find(j => j.job_hash === m.job_hash);
      return job && !job.categories?.includes("marketing");
    });

    const avgMarketingScore = marketingMatches.length > 0
      ? marketingMatches.reduce((sum, m) => sum + m.match_score, 0) / marketingMatches.length
      : 0;

    const avgNonMarketingScore = nonMarketingMatches.length > 0
      ? nonMarketingMatches.reduce((sum, m) => sum + m.match_score, 0) / nonMarketingMatches.length
      : 0;

    // False positive if non-marketing jobs score too high
    const falsePositiveRate = avgNonMarketingScore > 60 ? (avgNonMarketingScore - 60) / 40 : 0;
    const passed = falsePositiveRate < 0.3; // Less than 30% false positive rate
    const score = Math.max(0, 100 - (falsePositiveRate * 100));

    this.testResults.push({
      testName: "False Positive Rate",
      score,
      passed,
      details: {
        avgMarketingScore: Math.round(avgMarketingScore),
        avgNonMarketingScore: Math.round(avgNonMarketingScore),
        falsePositiveRate: `${Math.round(falsePositiveRate * 100)}%`
      },
      recommendations: !passed ? ["Too many irrelevant jobs getting high scores"] : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} False positive rate: ${Math.round(falsePositiveRate * 100)}%`);
  }

  private async testResultStability(): Promise<void> {
    console.log("🔄 Testing Result Stability...");

    const profile = TEST_PROFILES.softwareEngineer;
    const runs = [];

    // Run matching 3 times and check consistency
    for (let i = 0; i < 3; i++) {
      const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, profile);
      runs.push(matches.map(m => ({ hash: m.job_hash, score: m.match_score })));
    }

    // Check if top 2 matches are consistent
    const topMatchesRun1 = runs[0].slice(0, 2).map(m => m.hash);
    const topMatchesRun2 = runs[1].slice(0, 2).map(m => m.hash);
    const topMatchesRun3 = runs[2].slice(0, 2).map(m => m.hash);

    const consistency12 = topMatchesRun1.every(hash => topMatchesRun2.includes(hash));
    const consistency23 = topMatchesRun2.every(hash => topMatchesRun3.includes(hash));
    const consistency13 = topMatchesRun1.every(hash => topMatchesRun3.includes(hash));

    const passed = consistency12 && consistency23 && consistency13;
    const score = passed ? 95 : (consistency12 || consistency23 ? 70 : 40);

    this.testResults.push({
      testName: "Result Stability",
      score,
      passed,
      details: {
        run1Top2: topMatchesRun1,
        run2Top2: topMatchesRun2,
        run3Top2: topMatchesRun3,
        consistencyScore: `${[consistency12, consistency23, consistency13].filter(Boolean).length}/3`
      },
      recommendations: !passed ? ["Results not stable across multiple runs"] : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Stability: ${[consistency12, consistency23, consistency13].filter(Boolean).length}/3 runs consistent`);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const lowScoringTests = this.testResults.filter(r => r.score < 70);

    for (const test of lowScoringTests) {
      if (test.recommendations) {
        recommendations.push(...test.recommendations);
      }
    }

    // General recommendations based on patterns
    const avgScore = this.testResults.reduce((sum, r) => sum + r.score, 0) / this.testResults.length;

    if (avgScore < 75) {
      recommendations.push("Overall AI matching quality needs improvement - consider prompt engineering or model fine-tuning");
    }

    if (this.testResults.find(r => r.testName === "Result Diversity" && r.score < 60)) {
      recommendations.push("Increase result diversity by adjusting matching algorithms to consider broader criteria");
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private displayResults(overallScore: number, passedTests: number, totalTests: number, recommendations: string[]): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 AI RESULTS QUALITY TEST RESULTS");
    console.log("=".repeat(60));

    console.log(`🎯 Overall Quality Score: ${Math.round(overallScore)}/100`);
    console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

    console.log("\n📋 Detailed Results:");
    this.testResults.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`   ${status} ${test.testName}: ${test.score}/100`);
      if (test.details && typeof test.details === 'object') {
        const detailsStr = Object.entries(test.details)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        console.log(`      ${detailsStr}`);
      }
    });

    if (recommendations.length > 0) {
      console.log("\n💡 Recommendations:");
      recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    console.log("\n" + "=".repeat(60));

    const quality = overallScore >= 85 ? "EXCELLENT" :
                   overallScore >= 75 ? "GOOD" :
                   overallScore >= 65 ? "FAIR" : "NEEDS IMPROVEMENT";

    console.log(`🏆 Overall Quality: ${quality}`);
    console.log("=".repeat(60));
  }
}

async function main() {
  try {
    const tester = new AIResultsQualityTester();
    const results = await tester.runComprehensiveQualityTests();

    // Exit with code based on quality score
    const exitCode = results.overallScore >= 75 ? 0 : 1;
    process.exit(exitCode);

  } catch (error) {
    console.error("💥 Quality testing failed:", error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}