/**
 * Comprehensive test suite for the early-career classification fix
 * Tests the new hierarchical logic against real problematic cases
 */

import { isEarlyCareerJob, IngestJob } from "./scrapers/utils";

interface TestCase {
	name: string;
	job: IngestJob;
	expectedResult: boolean;
	reason: string;
}

const testCases: TestCase[] = [
	// ===== FALSE POSITIVES (OLD BUG) - Should NOW be REJECTED =====
	{
		name: "Senior Manager with 'marketing' keyword",
		job: {
			title: "Senior Marketing Manager",
			company: "TechCorp",
			location: "London, UK",
			description:
				"We seek an experienced Senior Marketing Manager with proven track record. Our company was founded by graduates from Stanford.",
			url: "https://example.com/1",
			source: "test",
		},
		expectedResult: false,
		reason: "Title contains 'Senior Manager' - should reject immediately",
	},
	{
		name: "Marketing Analyst with 5+ years required",
		job: {
			title: "Marketing Analyst",
			company: "ConsultingFirm",
			location: "Berlin, Germany",
			description:
				"Marketing Analyst position. Minimum 5 years of relevant marketing experience required. MBA preferred.",
			url: "https://example.com/2",
			source: "test",
		},
		expectedResult: false,
		reason: "Description explicitly requires 5+ years experience - should reject",
	},
	{
		name: "Business Analyst with MBA required",
		job: {
			title: "Business Analyst",
			company: "FinanceInc",
			location: "Frankfurt, Germany",
			description:
				"Business Analyst with MBA required. We seek a seasoned professional with extensive experience in financial markets.",
			url: "https://example.com/3",
			source: "test",
		},
		expectedResult: false,
		reason: "MBA required + extensive experience phrase - clear senior role",
	},
	{
		name: "Assistant Director (Senior role with 'Assistant')",
		job: {
			title: "Assistant Director",
			company: "MediaCorp",
			location: "Paris, France",
			description:
				"We are looking for an Assistant Director to lead our creative team. Minimum 7 years directing experience.",
			url: "https://example.com/4",
			source: "test",
		},
		expectedResult: false,
		reason: "Title has Director keyword - immediate rejection regardless of 'Assistant'",
	},
	{
		name: "Trainee Accountant with 5 years experience (contradictory)",
		job: {
			title: "Trainee Accountant",
			company: "AccountingFirm",
			location: "Amsterdam, Netherlands",
			description:
				"We seek a Trainee Accountant with 5+ years of accounting experience and CPA qualification.",
			url: "https://example.com/5",
			source: "test",
		},
		expectedResult: false,
		reason: "Professional qualification (CPA) + 5+ years requirement in description - reject despite 'Trainee' title",
	},

	// ===== WEAK SENIOR DETECTION (OLD BUG) - Should NOW be REJECTED =====
	{
		name: "Lead Engineer (old bug: 'lead' might not catch this)",
		job: {
			title: "Lead Software Engineer",
			company: "StartupXYZ",
			location: "Dublin, Ireland",
			description:
				"Looking for a Lead Software Engineer to manage our backend team. Technical leadership required.",
			url: "https://example.com/6",
			source: "test",
		},
		expectedResult: false,
		reason: "'Lead' in title should be immediately rejected",
	},
	{
		name: "CFA Required (professional qualification)",
		job: {
			title: "Financial Analyst",
			company: "AssetManagement",
			location: "Zurich, Switzerland",
			description:
				"We seek a Financial Analyst with CFA certification. Proven track record in portfolio management.",
			url: "https://example.com/7",
			source: "test",
		},
		expectedResult: false,
		reason: "CFA required in description - clear senior/mid-level role",
	},
	{
		name: "Chartered Engineer (professional qualification)",
		job: {
			title: "Chartered Engineer",
			company: "EngineeringCorp",
			location: "Stockholm, Sweden",
			description: "We need a qualified Chartered Engineer with extensive experience.",
			url: "https://example.com/8",
			source: "test",
		},
		expectedResult: false,
		reason: "'Chartered' is professional qualification - should reject",
	},

	// ===== BOILERPLATE POLLUTION (OLD BUG) - Should NOW IGNORE BOILERPLATE =====
	{
		name: "Early-career role with company boilerplate",
		job: {
			title: "Graduate Software Engineer",
			company: "TechGiant",
			location: "London, UK",
			description:
				"Graduate Software Engineer role. Our company was founded by graduates from MIT and Stanford. We train junior staff to become senior leaders. Our executive team includes former interns who are now VPs.",
			url: "https://example.com/9",
			source: "test",
		},
		expectedResult: true,
		reason: "Strong early career signal 'Graduate' in title - ignore boilerplate",
	},

	// ===== CORRECT TRUE POSITIVES - Should STILL be ACCEPTED =====
	{
		name: "Graduate Scheme (strong signal)",
		job: {
			title: "Graduate Scheme Software Engineer",
			company: "InvestmentBank",
			location: "London, UK",
			description:
				"Join our graduate scheme as a Software Engineer. This is our flagship entry-level program for new graduates.",
			url: "https://example.com/10",
			source: "test",
		},
		expectedResult: true,
		reason: "'Graduate Scheme' is explicit early career indicator",
	},
	{
		name: "Internship (strong signal)",
		job: {
			title: "Summer Internship - Marketing",
			company: "FashionBrand",
			location: "Milan, Italy",
			description:
				"We are hiring Summer Interns for our Marketing department. Perfect for students and recent graduates.",
			url: "https://example.com/11",
			source: "test",
		},
		expectedResult: true,
		reason: "Internship is explicit early career indicator",
	},
	{
		name: "Junior Developer (strong signal)",
		job: {
			title: "Junior Developer",
			company: "WebAgency",
			location: "Barcelona, Spain",
			description:
				"We are looking for a Junior Developer to join our growing team. No prior experience necessary.",
			url: "https://example.com/12",
			source: "test",
		},
		expectedResult: true,
		reason: "'Junior' in title is early career signal",
	},
	{
		name: "Entry-level Analyst with no experience needed",
		job: {
			title: "Entry-level Data Analyst",
			company: "DataCorp",
			location: "Copenhagen, Denmark",
			description:
				"Entry-level position. We provide training and mentorship. Perfect for recent graduates with no experience.",
			url: "https://example.com/13",
			source: "test",
		},
		expectedResult: true,
		reason: "'Entry-level' in title + context in description",
	},
	{
		name: "Apprenticeship (strong signal)",
		job: {
			title: "Apprenticeship - Electrical Engineering",
			company: "TechTrain",
			location: "Vienna, Austria",
			description:
				"Registered apprenticeship program. Learn on the job with mentorship from experienced professionals.",
			url: "https://example.com/14",
			source: "test",
		},
		expectedResult: true,
		reason: "'Apprenticeship' is explicit early career indicator",
	},
	{
		name: "Business Analyst (entry-level) with positive context",
		job: {
			title: "Business Analyst",
			company: "ConsultingStartup",
			location: "Warsaw, Poland",
			description:
				"Business Analyst needed. Entry level position perfect for graduates. Training provided. No prior experience required.",
			url: "https://example.com/15",
			source: "test",
		},
		expectedResult: true,
		reason: "Ambiguous title 'analyst' but description has entry-level context",
	},
	{
		name: "Marketing Assistant (entry-level form)",
		job: {
			title: "Marketing Assistant",
			company: "RetailChain",
			location: "Lisbon, Portugal",
			description:
				"Marketing Assistant role. Join our team as an entry-level marketing professional. Training provided.",
			url: "https://example.com/16",
			source: "test",
		},
		expectedResult: true,
		reason: "Ambiguous title but description has entry-level context in first 300 chars",
	},

	// ===== EDGE CASES =====
	{
		name: "Trainee with NO experience requirement contradiction",
		job: {
			title: "Trainee",
			company: "Bank",
			location: "Frankfurt, Germany",
			description:
				"Graduate trainee program. Perfect for new graduates. No banking experience necessary.",
			url: "https://example.com/17",
			source: "test",
		},
		expectedResult: true,
		reason: "'Trainee' is strong early career signal",
	},
	{
		name: "Principal Analyst (Senior - should reject)",
		job: {
			title: "Principal Analyst",
			company: "ConsultingGiant",
			location: "Amsterdam, Netherlands",
			description: "Senior leadership role for experienced analytics professional.",
			url: "https://example.com/18",
			source: "test",
		},
		expectedResult: false,
		reason: "'Principal' is senior title - immediate rejection",
	},
	{
		name: "Analyst with no context (ambiguous - default accept)",
		job: {
			title: "Analyst",
			company: "Unknown",
			location: "Prague, Czech Republic",
			description:
				"Analyst position available. Please see the job description for more details.",
			url: "https://example.com/19",
			source: "test",
		},
		expectedResult: true,
		reason: "Ambiguous title with no clear senior signals - cautiously accept",
	},
	{
		name: "Remote with no experience + junior",
		job: {
			title: "Junior Remote Developer",
			company: "StartupRock",
			location: "Remote",
			description:
				"Junior Developer wanted for remote role. Work from anywhere. Fresh graduates welcome.",
			url: "https://example.com/20",
			source: "test",
		},
		expectedResult: true,
		reason: "'Junior' is strong signal regardless of remote status",
	},
];

// Test runner
function runTests() {
	console.log("🧪 EARLY-CAREER CLASSIFICATION TEST SUITE\n");
	console.log("=".repeat(80));

	let passed = 0;
	let failed = 0;
	const failedTests: string[] = [];

	testCases.forEach((testCase, index) => {
		const result = isEarlyCareerJob(testCase.job);
		const isPass = result === testCase.expectedResult;

		const status = isPass ? "✅ PASS" : "❌ FAIL";
		console.log(
			`\n[${index + 1}/${testCases.length}] ${status} - ${testCase.name}`,
		);
		console.log(`    Expected: ${testCase.expectedResult}, Got: ${result}`);
		console.log(`    Reason: ${testCase.reason}`);
		console.log(`    Title: "${testCase.job.title}"`);

		if (isPass) {
			passed++;
		} else {
			failed++;
			failedTests.push(testCase.name);
		}
	});

	console.log("\n" + "=".repeat(80));
	console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed out of ${testCases.length}`);

	if (failed > 0) {
		console.log("\n❌ FAILED TESTS:");
		failedTests.forEach((name) => console.log(`   - ${name}`));
		process.exit(1);
	} else {
		console.log("\n🎉 ALL TESTS PASSED!");
		process.exit(0);
	}
}

// Run tests
runTests();

