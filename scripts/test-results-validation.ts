#!/usr/bin/env tsx
/**
 * Results Validation Testing
 *
 * Tests the structure, format, and data integrity of API responses.
 * Ensures results meet contract requirements and contain valid data.
 */

import { AIMatchingService } from "../Utils/matching/ai-matching.service";
import type { Job } from "../scrapers/types";
import type { NormalizedUserProfile } from "../Utils/matching/types";

interface ValidationResult {
  testName: string;
  passed: boolean;
  details: any;
  errors?: string[];
}

const TEST_JOBS: Job[] = [
  {
    id: 1,
    job_hash: "validation-test-1",
    title: "Software Engineer",
    company: "TestCorp",
    location: "London, UK",
    city: "London",
    country: "UK",
    job_url: "https://example.com/job1",
    description: "Test job description for validation",
    experience_required: "entry-level",
    work_environment: "hybrid",
    source: "test",
    categories: ["early-career", "tech"],
    company_profile_url: "",
    language_requirements: ["English"],
    scrape_timestamp: new Date().toISOString(),
    original_posted_date: new Date().toISOString(),
    posted_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const TEST_PROFILE: NormalizedUserProfile = {
  email: "validation-test@example.com",
  career_path: ["tech"],
  target_cities: ["London"],
  professional_expertise: "software development",
  work_environment: "hybrid",
  visa_status: "eu-citizen",
  entry_level_preference: "entry",
  full_name: "Validation Test User",
  start_date: new Date().toISOString().split('T')[0],
  languages_spoken: ["English"],
  company_types: ["tech"],
  roles_selected: ["software-engineer"],
  skills: ["JavaScript"],
};

class ResultsValidationTester {
  private aiService: AIMatchingService;
  private results: ValidationResult[] = [];

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY required for validation testing");
    }
    this.aiService = new AIMatchingService();
  }

  async runValidationTests(): Promise<{
    allPassed: boolean;
    passedTests: number;
    totalTests: number;
    results: ValidationResult[];
  }> {
    console.log("🔍 Results Validation Testing\n");
    console.log("=".repeat(50));

    this.results = [];

    await this.testResponseStructure();
    await this.testDataTypes();
    await this.testRequiredFields();
    await this.testDataRanges();
    await this.testURLValidation();
    await this.testDateFormats();
    await this.testStringLengths();
    await this.testArrayContents();

    const passedTests = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;
    const allPassed = passedTests === totalTests;

    this.displayResults(allPassed, passedTests, totalTests);

    return {
      allPassed,
      passedTests,
      totalTests,
      results: this.results
    };
  }

  private async testResponseStructure(): Promise<void> {
    console.log("🏗️  Testing Response Structure...");

    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, TEST_PROFILE);

    const errors: string[] = [];
    let passed = true;

    // Check if response is array
    if (!Array.isArray(matches)) {
      errors.push("Response is not an array");
      passed = false;
    }

    // Check each match has required structure
    matches.forEach((match, index) => {
      if (typeof match !== 'object') {
        errors.push(`Match ${index} is not an object`);
        passed = false;
        return;
      }

      const requiredFields = ['job_index', 'job_hash', 'match_score', 'match_reason'];
      for (const field of requiredFields) {
        if (!(field in match)) {
          errors.push(`Match ${index} missing required field: ${field}`);
          passed = false;
        }
      }
    });

    this.results.push({
      testName: "Response Structure",
      passed,
      details: {
        responseType: Array.isArray(matches) ? 'array' : typeof matches,
        matchCount: matches.length,
        structureValid: passed
      },
      errors: errors.length > 0 ? errors : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Structure: ${passed ? 'valid' : 'invalid'} (${errors.length} errors)`);
  }

  private async testDataTypes(): Promise<void> {
    console.log("📊 Testing Data Types...");

    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, TEST_PROFILE);

    const errors: string[] = [];
    let passed = true;

    matches.forEach((match, index) => {
      // job_index should be number
      if (typeof match.job_index !== 'number') {
        errors.push(`Match ${index} job_index is ${typeof match.job_index}, expected number`);
        passed = false;
      }

      // job_hash should be string
      if (typeof match.job_hash !== 'string') {
        errors.push(`Match ${index} job_hash is ${typeof match.job_hash}, expected string`);
        passed = false;
      }

      // match_score should be number
      if (typeof match.match_score !== 'number') {
        errors.push(`Match ${index} match_score is ${typeof match.match_score}, expected number`);
        passed = false;
      }

      // match_reason should be string
      if (typeof match.match_reason !== 'string') {
        errors.push(`Match ${index} match_reason is ${typeof match.match_reason}, expected string`);
        passed = false;
      }
    });

    this.results.push({
      testName: "Data Types",
      passed,
      details: {
        matchesChecked: matches.length,
        typeValidationPassed: passed
      },
      errors: errors.length > 0 ? errors : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Data types: ${passed ? 'valid' : 'invalid'} (${errors.length} errors)`);
  }

  private async testRequiredFields(): Promise<void> {
    console.log("📋 Testing Required Fields...");

    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, TEST_PROFILE);

    const errors: string[] = [];
    let passed = true;

    matches.forEach((match, index) => {
      // Check no null/undefined values in required fields
      if (!match.job_hash || match.job_hash.trim() === '') {
        errors.push(`Match ${index} has empty job_hash`);
        passed = false;
      }

      if (!match.match_reason || match.match_reason.trim() === '') {
        errors.push(`Match ${index} has empty match_reason`);
        passed = false;
      }

      // match_score should be defined
      if (match.match_score === null || match.match_score === undefined) {
        errors.push(`Match ${index} has null/undefined match_score`);
        passed = false;
      }
    });

    this.results.push({
      testName: "Required Fields",
      passed,
      details: {
        matchesChecked: matches.length,
        requiredFieldsPresent: passed
      },
      errors: errors.length > 0 ? errors : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Required fields: ${passed ? 'present' : 'missing'} (${errors.length} errors)`);
  }

  private async testDataRanges(): Promise<void> {
    console.log("📏 Testing Data Ranges...");

    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, TEST_PROFILE);

    const errors: string[] = [];
    let passed = true;

    matches.forEach((match, index) => {
      // match_score should be 0-100
      if (match.match_score < 0 || match.match_score > 100) {
        errors.push(`Match ${index} match_score ${match.match_score} out of range (0-100)`);
        passed = false;
      }

      // job_index should be positive integer
      if (!Number.isInteger(match.job_index) || match.job_index < 1) {
        errors.push(`Match ${index} job_index ${match.job_index} invalid (should be positive integer)`);
        passed = false;
      }

      // match_reason should be reasonable length
      if (match.match_reason.length < 10) {
        errors.push(`Match ${index} match_reason too short (${match.match_reason.length} chars)`);
        passed = false;
      }

      if (match.match_reason.length > 1000) {
        errors.push(`Match ${index} match_reason too long (${match.match_reason.length} chars)`);
        passed = false;
      }
    });

    this.results.push({
      testName: "Data Ranges",
      passed,
      details: {
        matchesChecked: matches.length,
        rangesValid: passed,
        scoreRange: matches.map(m => m.match_score).join(', ')
      },
      errors: errors.length > 0 ? errors : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Data ranges: ${passed ? 'valid' : 'invalid'} (${errors.length} errors)`);
  }

  private async testURLValidation(): Promise<void> {
    console.log("🔗 Testing URL Validation...");

    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, TEST_PROFILE);

    const errors: string[] = [];
    let passed = true;

    matches.forEach((match, index) => {
      const job = TEST_JOBS.find(j => j.job_hash === match.job_hash);
      if (job && job.job_url) {
        try {
          const url = new URL(job.job_url);
          if (!url.protocol.startsWith('http')) {
            errors.push(`Match ${index} invalid URL protocol: ${url.protocol}`);
            passed = false;
          }
        } catch (e) {
          errors.push(`Match ${index} invalid URL format: ${job.job_url}`);
          passed = false;
        }
      }
    });

    this.results.push({
      testName: "URL Validation",
      passed,
      details: {
        urlsChecked: matches.length,
        urlsValid: passed
      },
      errors: errors.length > 0 ? errors : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} URLs: ${passed ? 'valid' : 'invalid'} (${errors.length} errors)`);
  }

  private async testDateFormats(): Promise<void> {
    console.log("📅 Testing Date Formats...");

    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, TEST_PROFILE);

    const errors: string[] = [];
    let passed = true;

    matches.forEach((match, index) => {
      const job = TEST_JOBS.find(j => j.job_hash === match.job_hash);
      if (job) {
        const dateFields = ['scrape_timestamp', 'original_posted_date', 'posted_at', 'last_seen_at', 'created_at'];

        dateFields.forEach(field => {
          const dateValue = (job as any)[field];
          if (dateValue) {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) {
              errors.push(`Match ${index} ${field} invalid date: ${dateValue}`);
              passed = false;
            }
          }
        });
      }
    });

    this.results.push({
      testName: "Date Formats",
      passed,
      details: {
        datesChecked: matches.length * 5, // 5 date fields per job
        datesValid: passed
      },
      errors: errors.length > 0 ? errors : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Dates: ${passed ? 'valid' : 'invalid'} (${errors.length} errors)`);
  }

  private async testStringLengths(): Promise<void> {
    console.log("📏 Testing String Lengths...");

    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, TEST_PROFILE);

    const errors: string[] = [];
    let passed = true;

    matches.forEach((match, index) => {
      const job = TEST_JOBS.find(j => j.job_hash === match.job_hash);
      if (job) {
        // Title should be reasonable length
        if (job.title.length < 3 || job.title.length > 200) {
          errors.push(`Match ${index} title length ${job.title.length} out of range (3-200)`);
          passed = false;
        }

        // Company should be reasonable length
        if (job.company.length < 2 || job.company.length > 100) {
          errors.push(`Match ${index} company length ${job.company.length} out of range (2-100)`);
          passed = false;
        }

        // Description should be substantial
        if (job.description.length < 50) {
          errors.push(`Match ${index} description too short (${job.description.length} chars)`);
          passed = false;
        }
      }

      // Match reason should be detailed enough
      if (match.match_reason.length < 20) {
        errors.push(`Match ${index} match_reason too brief (${match.match_reason.length} chars)`);
        passed = false;
      }
    });

    this.results.push({
      testName: "String Lengths",
      passed,
      details: {
        stringsChecked: matches.length * 4, // title, company, description, match_reason
        lengthsValid: passed
      },
      errors: errors.length > 0 ? errors : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} String lengths: ${passed ? 'valid' : 'invalid'} (${errors.length} errors)`);
  }

  private async testArrayContents(): Promise<void> {
    console.log("📦 Testing Array Contents...");

    const matches = await this.aiService.performEnhancedAIMatching(TEST_JOBS, TEST_PROFILE);

    const errors: string[] = [];
    let passed = true;

    matches.forEach((match, index) => {
      const job = TEST_JOBS.find(j => j.job_hash === match.job_hash);
      if (job) {
        // Categories should be non-empty array
        if (!Array.isArray(job.categories) || job.categories.length === 0) {
          errors.push(`Match ${index} categories not valid array or empty`);
          passed = false;
        }

        // Language requirements should be array if present
        if (job.language_requirements && !Array.isArray(job.language_requirements)) {
          errors.push(`Match ${index} language_requirements not array`);
          passed = false;
        }

        // Check for empty strings in arrays
        if (Array.isArray(job.categories)) {
          if (job.categories.some(cat => !cat || cat.trim() === '')) {
            errors.push(`Match ${index} categories contains empty values`);
            passed = false;
          }
        }

        if (Array.isArray(job.language_requirements)) {
          if (job.language_requirements.some(lang => !lang || lang.trim() === '')) {
            errors.push(`Match ${index} language_requirements contains empty values`);
            passed = false;
          }
        }
      }
    });

    this.results.push({
      testName: "Array Contents",
      passed,
      details: {
        arraysChecked: matches.length * 2, // categories and language_requirements
        arraysValid: passed
      },
      errors: errors.length > 0 ? errors : undefined
    });

    console.log(`   ${passed ? '✅' : '❌'} Arrays: ${passed ? 'valid' : 'invalid'} (${errors.length} errors)`);
  }

  private displayResults(allPassed: boolean, passedTests: number, totalTests: number): void {
    console.log("\n" + "=".repeat(50));
    console.log("📊 RESULTS VALIDATION TEST RESULTS");
    console.log("=".repeat(50));

    console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

    console.log("\n📋 Validation Results:");
    this.results.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`   ${status} ${test.testName}`);
      if (test.errors && test.errors.length > 0) {
        test.errors.forEach(error => console.log(`      • ${error}`));
      }
    });

    console.log("\n" + "=".repeat(50));
    console.log(`🏆 Overall: ${allPassed ? 'VALIDATION PASSED' : 'VALIDATION FAILED'}`);
    console.log("=".repeat(50));
  }
}

async function main() {
  try {
    const tester = new ResultsValidationTester();
    const results = await tester.runValidationTests();

    process.exit(results.allPassed ? 0 : 1);

  } catch (error) {
    console.error("💥 Validation testing failed:", error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}