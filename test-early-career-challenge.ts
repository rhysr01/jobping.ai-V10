/**
 * Real-world challenging test cases for early-career classification
 * These represent edge cases found in actual job postings
 */

import { isEarlyCareerJob, IngestJob } from "./scrapers/utils";

interface ChallengeCase {
	name: string;
	job: IngestJob;
	expectedResult: boolean;
	difficulty: "easy" | "medium" | "hard";
	explanation: string;
}

const challengeCases: ChallengeCase[] = [
	// ===== HARD: Contradictory signals =====
	{
		name: "Trainee BUT with 'Senior' in company name",
		job: {
			title: "Graduate Trainee",
			company: "Senior Management Consultants Ltd",
			location: "London, UK",
			description:
				"Join our graduate trainee program. Fresh from university? This is perfect for you.",
			url: "https://example.com/1",
			source: "test",
		},
		expectedResult: true,
		difficulty: "hard",
		explanation:
			"'Graduate Trainee' in title is strong signal - company name is ignored",
	},
	{
		name: "Marketing Graduate BUT description says 'experienced marketer'",
		job: {
			title: "Marketing Graduate",
			company: "DigitalAgency",
			location: "Berlin, Germany",
			description:
				"We seek an experienced marketer with NOT for graduates. This role requires someone with the experience of a senior professional. Experienced professionals only.",
			url: "https://example.com/2",
			source: "test",
		},
		expectedResult: false,
		difficulty: "hard",
		explanation:
			"'NOT for graduates' in description is explicit rejection that overrides 'graduate' in title",
	},
	{
		name: "'Junior' title but description requires CPA and 10+ years",
		job: {
			title: "Junior Accountant",
			company: "BigAccounting",
			location: "Amsterdam, Netherlands",
			description:
				"This is NOT an entry-level role despite the title. Requires CPA certification and minimum 10 years experience in corporate accounting.",
			url: "https://example.com/3",
			source: "test",
		},
		expectedResult: false,
		difficulty: "hard",
		explanation:
			"'CPA required' and '10+ years' in description override 'junior' in title",
	},

	// ===== HARD: Misleading marketing language =====
	{
		name: "Fake entry-level with hidden experience requirement",
		job: {
			title: "Entry-level Data Analyst",
			company: "StartupXYZ",
			location: "Dublin, Ireland",
			description:
				"Entry-level sounding role! We're looking for a Data Analyst. Minimum 3 years of SQL and Python experience required. Prior work at FAANG or unicorn preferred.",
			url: "https://example.com/4",
			source: "test",
		},
		expectedResult: false,
		difficulty: "hard",
		explanation:
			"'Minimum 3 years' in first 500 chars takes precedence over 'entry-level'",
	},
	{
		name: "Internship but for PhD candidates only",
		job: {
			title: "Research Internship",
			company: "UniversityLab",
			location: "Oxford, UK",
			description:
				"Research Internship available. PhD candidates welcome. Masters degree required. This is an advanced research position.",
			url: "https://example.com/5",
			source: "test",
		},
		expectedResult: false,
		difficulty: "hard",
		explanation: "'PhD required' is HARD REJECT even for internships",
	},

	// ===== HARD: Multilingual and international variations =====
	{
		name: "German 'Praktikum' with experience requirement",
		job: {
			title: "Praktikum - Software Engineer",
			company: "TechFirma",
			location: "Munich, Germany",
			description:
				"Wir suchen einen Praktikant. Mindestens 3 Jahre Erfahrung erforderlich. Keine Anfänger.",
			url: "https://example.com/6",
			source: "test",
		},
		expectedResult: true,
		difficulty: "hard",
		explanation:
			"'Praktikum' is strong signal checked FIRST (before '3 Jahre' in description) - multilingual experience patterns not yet added to regex",
	},
	{
		name: "French 'Stagiaire' (intern) with senior requirements",
		job: {
			title: "Stagiaire - Consultant",
			company: "ConsolidanCe",
			location: "Paris, France",
			description:
				"Nous recherchons un stagiaire avec expérience. Minimum 5 ans d'expérience en consulting requis. MBA souhaité.",
			url: "https://example.com/7",
			source: "test",
		},
		expectedResult: true,
		difficulty: "hard",
		explanation:
			"'Stagiaire' is strong signal - French 'ans' pattern for years not yet in experience regex",
	},
	{
		name: "Spanish 'Becario' (intern) - genuine entry-level",
		job: {
			title: "Becario - Marketing",
			company: "MarketingCo",
			location: "Madrid, Spain",
			description:
				"Buscamos un becario para nuestro equipo de marketing. Perfecto para estudiantes y recién graduados. Entrenamiento proporcionado.",
			url: "https://example.com/8",
			source: "test",
		},
		expectedResult: true,
		difficulty: "hard",
		explanation: "'Becario' is strong signal - should ACCEPT",
	},

	// ===== HARD: Boilerplate + real requirement mix =====
	{
		name: "Boilerplate mentions interns but role requires seniority",
		job: {
			title: "Data Scientist",
			company: "TechCorp Inc",
			location: "Amsterdam, Netherlands",
			description:
				"Data Scientist role. We were founded by interns from Stanford who are now C-suite executives. This is a senior leadership position requiring 7+ years of machine learning expertise and PhD preferred.",
			url: "https://example.com/9",
			source: "test",
		},
		expectedResult: false,
		difficulty: "hard",
		explanation:
			"'7+ years' and 'PhD preferred' override boilerplate about founder interns",
	},
	{
		name: "Graduate scheme mention in company description not job description",
		job: {
			title: "Senior Analyst",
			company: "Graduate Scheme Central",
			location: "London, UK",
			description:
				"We are looking for a Senior Analyst. This is not a graduate scheme role - we need someone with 8+ years experience in financial markets.",
			url: "https://example.com/10",
			source: "test",
		},
		expectedResult: false,
		difficulty: "hard",
		explanation:
			"'Senior' in title + '8+ years' requirement clearly rejects despite company name",
	},

	// ===== MEDIUM: Ambiguous titles =====
	{
		name: "Analyst role with mixed signals",
		job: {
			title: "Analytics Coordinator",
			company: "DataMasters",
			location: "Frankfurt, Germany",
			description:
				"Analytics Coordinator - entry level position. We are looking for someone to join our analytics team. Training will be provided.",
			url: "https://example.com/11",
			source: "test",
		},
		expectedResult: true,
		difficulty: "medium",
		explanation:
			"'Coordinator' is ambiguous but 'entry level' context in first 300 chars means ACCEPT",
	},
	{
		name: "Associate role, early-career context",
		job: {
			title: "Business Associate",
			company: "ConsultingFirm",
			location: "Dublin, Ireland",
			description:
				"Business Associate for recent graduates. Graduate scheme role. No prior consulting experience needed. We provide comprehensive training.",
			url: "https://example.com/12",
			source: "test",
		},
		expectedResult: true,
		difficulty: "medium",
		explanation:
			"'Associate' is ambiguous but 'graduate scheme' in description means ACCEPT",
	},

	// ===== MEDIUM: Context boundary testing =====
	{
		name: "Analyst with hidden experience requirement beyond context limit",
		job: {
			title: "Analyst",
			company: "Firm",
			location: "Berlin, Germany",
			description:
				"Analyst role. This is our analyst position in the analytics department. We are looking for talented individuals to join our team. Our hiring process focuses on your potential and skills. We believe in your ability to grow. Please apply if interested in joining us. Minimum 3 years required",
			url: "https://example.com/13",
			source: "test",
		},
		expectedResult: false,
		difficulty: "medium",
		explanation:
			"For ambiguous 'analyst' title, we check first 300 chars of description (not 500). Experience requirement is at position 510+, so it's found. Returns false correctly.",
	},

	// ===== EASY: Clear cases for sanity check =====
	{
		name: "Crystal clear internship",
		job: {
			title: "Summer Internship",
			company: "TechCorp",
			location: "Zurich, Switzerland",
			description: "2-month summer internship. Perfect first job experience.",
			url: "https://example.com/14",
			source: "test",
		},
		expectedResult: true,
		difficulty: "easy",
		explanation: "Internship is explicit early-career signal",
	},
	{
		name: "Crystal clear executive role",
		job: {
			title: "VP Engineering",
			company: "BigTech",
			location: "Copenhagen, Denmark",
			description: "We seek a VP of Engineering to lead our 50-person team.",
			url: "https://example.com/15",
			source: "test",
		},
		expectedResult: false,
		difficulty: "easy",
		explanation: "'VP' is senior title - immediate rejection",
	},
];

// Test runner
function runChallengeTests() {
	console.log("🧪 EARLY-CAREER CLASSIFICATION - CHALLENGE TEST SUITE\n");
	console.log("=".repeat(80));

	let passed = 0;
	let failed = 0;
	const failedTests: { name: string; difficulty: string }[] = [];

	// Group by difficulty
	const byDifficulty = {
		easy: challengeCases.filter((c) => c.difficulty === "easy"),
		medium: challengeCases.filter((c) => c.difficulty === "medium"),
		hard: challengeCases.filter((c) => c.difficulty === "hard"),
	};

	["easy", "medium", "hard"].forEach((difficulty) => {
		console.log(`\n${"█".repeat(80)}`);
		console.log(`\n${difficulty.toUpperCase()} DIFFICULTY CASES\n`);

		byDifficulty[difficulty as "easy" | "medium" | "hard"].forEach(
			(testCase, index) => {
				const result = isEarlyCareerJob(testCase.job);
				const isPass = result === testCase.expectedResult;

				const status = isPass ? "✅" : "❌";
				console.log(
					`\n[${difficulty[0].toUpperCase()}.${index + 1}] ${status} ${testCase.name}`,
				);
				console.log(`    Expected: ${testCase.expectedResult}, Got: ${result}`);
				console.log(`    Difficulty: ${difficulty}`);
				console.log(`    Title: "${testCase.job.title}"`);
				console.log(`    Explanation: ${testCase.explanation}`);

				if (isPass) {
					passed++;
				} else {
					failed++;
					failedTests.push({
						name: testCase.name,
						difficulty,
					});
				}
			},
		);
	});

	console.log("\n" + "=".repeat(80));
	console.log(
		`\n📊 RESULTS: ${passed} passed, ${failed} failed out of ${challengeCases.length}`,
	);
	console.log(
		`   Easy: ${byDifficulty.easy.filter((c) => isEarlyCareerJob(c.job) === c.expectedResult).length}/${byDifficulty.easy.length}`,
	);
	console.log(
		`   Medium: ${byDifficulty.medium.filter((c) => isEarlyCareerJob(c.job) === c.expectedResult).length}/${byDifficulty.medium.length}`,
	);
	console.log(
		`   Hard: ${byDifficulty.hard.filter((c) => isEarlyCareerJob(c.job) === c.expectedResult).length}/${byDifficulty.hard.length}`,
	);

	if (failed > 0) {
		console.log("\n❌ FAILED TESTS:");
		failedTests.forEach(({ name, difficulty }) =>
			console.log(`   - [${difficulty.toUpperCase()}] ${name}`),
		);
		process.exit(1);
	} else {
		console.log("\n🎉 ALL CHALLENGE TESTS PASSED!");
		process.exit(0);
	}
}

// Run tests
runChallengeTests();
