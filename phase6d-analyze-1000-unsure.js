#!/usr/bin/env node

/**
 * Phase 6D: Comprehensive Analysis of 1000 Unsure Jobs
 *
 * This script analyzes the remaining unsure jobs to identify new keywords
 * and patterns by career path. It processes the jobs in a systematic way
 * to find high-confidence keyword patterns.
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Career path keyword patterns to look for
const CAREER_PATH_PATTERNS = {
	"tech-transformation": {
		existing: [
			"react developer",
			"application developer",
			"qa engineer",
			"qe",
			"test automation",
			"software engineer",
			"web developer",
			"javascript developer",
			"python developer",
			"java developer",
			"senior developer",
			"backend engineer",
			"frontend engineer",
			"full stack developer",
			"devops",
			"cloud engineer",
			"systems engineer",
		],
		lookFor: [
			"developer",
			"engineer",
			"programmer",
			"architect",
			"technician",
			"it specialist",
			"technical support",
			"network",
			"database",
			"security",
			"infrastructure",
			"automation",
			"testing",
			"quality assurance",
			"api",
			"framework",
			"technology",
			"software",
			"application",
		],
	},
	"sales-client-success": {
		existing: [
			"account coordinator",
			"sales support",
			"account support",
			"sales representative",
			"account manager",
			"customer success",
			"client manager",
			"relationship manager",
		],
		lookFor: [
			"account",
			"sales",
			"client",
			"customer",
			"business development",
			"bd",
			"inside sales",
			"field sales",
			"coordinator",
			"representative",
			"manager",
			"support",
			"relationship",
			"key account",
			"territory",
		],
	},
	"product-management": {
		existing: ["product manager", "product specialist", "product owner"],
		lookFor: [
			"product manager",
			"pm",
			"product",
			"owner",
			"specialist",
			"lead",
			"coordinator",
			"roadmap",
			"strategy",
			"feature",
		],
	},
	"strategy-business-design": {
		existing: [
			"business analyst",
			"business analyst trainee",
			"business consultant",
			"consultant",
			"strategy",
		],
		lookFor: [
			"analyst",
			"consultant",
			"business",
			"strategy",
			"strategic",
			"planning",
			"organization",
			"process",
			"improvement",
			"design",
			"transformation",
			"change",
			"management",
		],
	},
	"marketing-growth": {
		existing: [
			"marketing manager",
			"marketing specialist",
			"content creator",
			"content writer",
			"graphic designer",
			"graphic designer trainee",
			"design trainee",
			"seo specialist",
			"digital marketing",
			"marketing coordinator",
		],
		lookFor: [
			"marketing",
			"content",
			"design",
			"creative",
			"social media",
			"seo",
			"ppc",
			"digital",
			"growth",
			"campaign",
			"brand",
			"copywriter",
			"graphic",
			"ui",
			"ux",
			"engagement",
			"strategy",
		],
	},
	"operations-supply-chain": {
		existing: [
			"warehouse associate",
			"operations analyst",
			"procurement assistant",
			"supply chain",
			"logistics",
			"warehouse",
			"operations manager",
			"operations coordinator",
		],
		lookFor: [
			"operations",
			"warehouse",
			"logistics",
			"supply chain",
			"inventory",
			"procurement",
			"planning",
			"coordinator",
			"associate",
			"analyst",
			"shipping",
			"fulfillment",
			"distribution",
			"stock",
			"vendor",
		],
	},
	"finance-investment": {
		existing: [
			"accounting clerk",
			"finance analyst intern",
			"accountant",
			"finance analyst",
			"financial analyst",
			"investment analyst",
			"bookkeeper",
		],
		lookFor: [
			"accounting",
			"finance",
			"accountant",
			"analyst",
			"investment",
			"financial",
			"bookkeeper",
			"controller",
			"auditor",
			"treasury",
			"tax",
			"billing",
			"payroll",
			"budget",
			"forecast",
		],
	},
	"people-organization": {
		existing: ["hr", "human resources", "recruiter", "recruitment", "talent"],
		lookFor: [
			"hr",
			"human resources",
			"recruiter",
			"recruitment",
			"talent",
			"training",
			"learning",
			"development",
			"compensation",
			"benefits",
			"people",
			"employee",
			"engagement",
			"culture",
		],
	},
	"customer-service": {
		existing: ["customer service", "support", "customer support", "help desk"],
		lookFor: [
			"customer service",
			"support",
			"help desk",
			"call center",
			"chat",
			"support agent",
			"customer care",
			"ticket",
			"troubleshoot",
		],
	},
};

// Analyze jobs and extract keywords
async function analyzeUnsureJobs() {
	console.log("🔄 Fetching 1000 unsure jobs from database...\n");

	const { data: jobs, error } = await supabase
		.from("jobs")
		.select("id, title, description, country, city")
		.contains("categories", ["unsure"])
		.limit(1000);

	if (error) {
		console.error("❌ Error fetching jobs:", error);
		process.exit(1);
	}

	console.log(`✅ Retrieved ${jobs.length} unsure jobs\n`);

	// Analyze each job and categorize by potential career path
	const keywordsByPath = {};
	const jobsByPath = {};
	const unmatchedJobs = [];

	for (const careerPath of Object.keys(CAREER_PATH_PATTERNS)) {
		keywordsByPath[careerPath] = {};
		jobsByPath[careerPath] = [];
	}

	// Process each job
	for (const job of jobs) {
		const titleLower = (job.title || "").toLowerCase();
		const descLower = (job.description || "").toLowerCase();
		const fullText = `${titleLower} ${descLower}`;

		let matched = false;

		// Try to match against each career path
		for (const [careerPath, patterns] of Object.entries(CAREER_PATH_PATTERNS)) {
			const allKeywords = [...patterns.existing, ...patterns.lookFor].map((k) =>
				k.toLowerCase(),
			);

			for (const keyword of allKeywords) {
				if (titleLower.includes(keyword) || descLower.includes(keyword)) {
					if (!keywordsByPath[careerPath][keyword]) {
						keywordsByPath[careerPath][keyword] = { count: 0, examples: [] };
					}
					keywordsByPath[careerPath][keyword].count++;

					if (keywordsByPath[careerPath][keyword].examples.length < 3) {
						keywordsByPath[careerPath][keyword].examples.push({
							title: job.title,
							id: job.id,
						});
					}

					jobsByPath[careerPath].push(job);
					matched = true;
					break;
				}
			}

			if (matched) break;
		}

		if (!matched) {
			unmatchedJobs.push(job);
		}
	}

	// Generate report
	console.log(
		"════════════════════════════════════════════════════════════════",
	);
	console.log("📊 PHASE 6D ANALYSIS REPORT - 1000 UNSURE JOBS");
	console.log(
		"════════════════════════════════════════════════════════════════\n",
	);

	console.log("📈 JOBS MATCHED BY CAREER PATH:\n");

	let totalMatched = 0;
	for (const [careerPath, jobs] of Object.entries(jobsByPath)) {
		const percentage = ((jobs.length / 1000) * 100).toFixed(1);
		console.log(`${careerPath}: ${jobs.length} (${percentage}%)`);
		totalMatched += jobs.length;
	}

	console.log(
		`\nUnmatched (no patterns found): ${unmatchedJobs.length} (${((unmatchedJobs.length / 1000) * 100).toFixed(1)}%)`,
	);
	console.log(`\n✅ Total Matched: ${totalMatched}/${jobs.length}\n`);

	// Extract new keywords (those with highest frequency that aren't already in careerPathInference.cjs)
	console.log(
		"════════════════════════════════════════════════════════════════",
	);
	console.log("🎯 NEW KEYWORD CANDIDATES BY CAREER PATH");
	console.log(
		"════════════════════════════════════════════════════════════════\n",
	);

	const newKeywordsByPath = {};

	for (const [careerPath, keywords] of Object.entries(keywordsByPath)) {
		const sorted = Object.entries(keywords)
			.sort((a, b) => b[1].count - a[1].count)
			.filter(([keyword]) => {
				const existing = CAREER_PATH_PATTERNS[careerPath].existing;
				return !existing.some((e) => e.toLowerCase() === keyword);
			})
			.slice(0, 15); // Top 15 candidates per path

		newKeywordsByPath[careerPath] = sorted;

		if (sorted.length > 0) {
			console.log(`\n${careerPath.toUpperCase()}`);
			console.log("─".repeat(50));

			for (const [keyword, data] of sorted) {
				const percentageOfPath = (
					(data.count / jobsByPath[careerPath].length) *
					100
				).toFixed(1);
				console.log(
					`  ✓ "${keyword}" (${data.count} occurrences, ${percentageOfPath}% of path)`,
				);

				if (data.examples.length > 0) {
					console.log(
						`    Examples: ${data.examples.map((e) => `"${e.title}"`).join(", ")}`,
					);
				}
			}
		}
	}

	// Find high-confidence keywords (appear in 10+ jobs)
	console.log(
		"\n════════════════════════════════════════════════════════════════",
	);
	console.log("⭐ HIGH-CONFIDENCE KEYWORDS (10+ occurrences)");
	console.log(
		"════════════════════════════════════════════════════════════════\n",
	);

	const highConfidenceKeywords = {};

	for (const [careerPath, keywords] of Object.entries(newKeywordsByPath)) {
		const highConf = keywords.filter(([, data]) => data.count >= 10);

		if (highConf.length > 0) {
			highConfidenceKeywords[careerPath] = highConf.map(([keyword]) => keyword);

			console.log(`\n${careerPath}:`);
			for (const [keyword, data] of highConf) {
				console.log(`  ⭐ "${keyword}" (${data.count})`);
			}
		}
	}

	// Generate recommendations
	console.log(
		"\n════════════════════════════════════════════════════════════════",
	);
	console.log("💡 RECOMMENDATIONS");
	console.log(
		"════════════════════════════════════════════════════════════════\n",
	);

	let totalHighConfidence = 0;
	for (const keywords of Object.values(highConfidenceKeywords)) {
		totalHighConfidence += keywords.length;
	}

	console.log(`Total High-Confidence Keywords: ${totalHighConfidence}`);
	console.log(
		`Expected Impact: +${(totalHighConfidence * 15).toLocaleString()} jobs reclassified`,
	);
	console.log(
		`Target: Reduce unsure from 4,070 to ~${(4070 - totalHighConfidence * 15).toLocaleString()}\n`,
	);

	// Save detailed analysis to file
	const analysisReport = {
		timestamp: new Date().toISOString(),
		totalJobsAnalyzed: jobs.length,
		totalMatched: totalMatched,
		totalUnmatched: unmatchedJobs.length,
		jobsByPath,
		keywordsByPath: newKeywordsByPath,
		highConfidenceKeywords,
		recommendations: {
			totalNewKeywords: totalHighConfidence,
			estimatedImpact: totalHighConfidence * 15,
			expectedUnsureAfterPhase6D: 4070 - totalHighConfidence * 15,
		},
	};

	fs.writeFileSync(
		"/Users/rhysrowlands/jobping/PHASE6D_ANALYSIS_REPORT.json",
		JSON.stringify(analysisReport, null, 2),
	);

	console.log("✅ Detailed analysis saved to PHASE6D_ANALYSIS_REPORT.json");

	// Save unmatched jobs for manual review
	fs.writeFileSync(
		"/Users/rhysrowlands/jobping/PHASE6D_UNMATCHED_JOBS.json",
		JSON.stringify(
			unmatchedJobs.slice(0, 50).map((j) => ({
				id: j.id,
				title: j.title,
				description: j.description ? j.description.substring(0, 200) : "",
				country: j.country,
				city: j.city,
			})),
			null,
			2,
		),
	);

	console.log(
		"✅ Sample of unmatched jobs saved to PHASE6D_UNMATCHED_JOBS.json\n",
	);

	return {
		newKeywordsByPath,
		highConfidenceKeywords,
		unmatchedJobs,
		totalNewKeywords: totalHighConfidence,
	};
}

// Main execution
analyzeUnsureJobs().catch((error) => {
	console.error("❌ Fatal error:", error);
	process.exit(1);
});
