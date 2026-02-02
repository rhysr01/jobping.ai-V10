const {
	getInferredCategories,
} = require("./scrapers/shared/careerPathInference.cjs");

// Test cases from the actual unsure jobs in the database
const testJobs = [
	{
		title: "Strategy & Operations Analyst Project Intern",
		description: "Strategy & Operations Analyst Project Intern at TikTok",
		expected: "strategy-business-design",
	},
	{
		title: "Consulting Analyst Summer Internship",
		description:
			"Roberts Group Consulting is a fast-growing transformation consulting firm",
		expected: "strategy-business-design",
	},
	{
		title: "Summer 2026 Intern: UKI Sales Strategy & Operations",
		description:
			"Sales Strategy team is the engine room of Salesforce's UKI business",
		expected: "strategy-business-design",
	},
	{
		title: "Werkstudent Business Analytics & Reporting",
		description:
			"Zahlen, Daten, Insights: Unterstütze das Management mit Analysen und Reportings",
		expected: "data-analytics",
	},
	{
		title: "Data Analist",
		description:
			"Als zorgverzekeraar hebben we aan die data geen gebrek. Wij zoeken versterking binnen het analistenteam",
		expected: "data-analytics",
	},
	{
		title: "Stage Back Office Automotive",
		description:
			"back office commerciale si occuperà di apertura cartella cliente, monitoraggio della pratica",
		expected: "finance-investment",
	},
	{
		title: "Stage : Stage économat",
		description: "Stagiaire économat, office management role in hotel",
		expected: "operations-supply-chain",
	},
	{
		title: "Stage Assistant Chef de Produit Marketing",
		description:
			"Analyse des performances marché, packaging development, social media strategy",
		expected: "marketing-growth",
	},
	{
		title: "Design Trainee",
		description:
			"Create print layouts and artwork across print and digital platforms for AD, Vogue",
		expected: "marketing-growth",
	},
	{
		title: "Praktikum ERP",
		description:
			"Praktikum ERP (w/m/d), support customers with ERP systems, optimize business processes",
		expected: "operations-supply-chain",
	},
	{
		title: "Internship Experience Design",
		description:
			"internship in experience design, Munich team, 6-month paid internship",
		expected: "marketing-growth",
	},
	{
		title: "Werkstudent (m/w/d) Office Management München",
		description:
			"Office Management, postmanagement, reception, supplier management",
		expected: "operations-supply-chain",
	},
	{
		title: "Stage Client Service - Investor Relations",
		description: "Client Service - Investor Relations role at Rothschild",
		expected: "sales-client-success",
	},
];

console.log("Testing improved career path inference...\n");

let correct = 0;
let total = 0;

testJobs.forEach((job) => {
	const result = getInferredCategories(job.title, job.description);
	const category = result ? result[0] : "null";
	const isCorrect = category === job.expected;

	if (isCorrect) {
		correct++;
	}

	total++;

	const status = isCorrect ? "✅" : "❌";
	console.log(`${status} ${job.title}`);
	console.log(`   Expected: ${job.expected}, Got: ${category}`);
	if (!isCorrect) {
		console.log(`   Title: ${job.title}`);
		console.log(`   Desc: ${job.description.substring(0, 80)}...`);
	}
	console.log();
});

const accuracy = ((correct / total) * 100).toFixed(1);
console.log(
	`\n📊 Results: ${correct}/${total} correct (${accuracy}% accuracy)`,
);
