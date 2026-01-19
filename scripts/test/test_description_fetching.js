// Test script to verify full description fetching works
require("dotenv").config({ path: ".env.local" });
const { fetchFullJobDescription } = require("./scrapers/shared/helpers.cjs");

async function testDescriptionFetching() {
	console.log("Testing full description fetching...");

	// Test with a short description that should trigger fetching
	const shortDescription = "This is a short job description.";
	const jobUrl = "https://www.reed.co.uk/jobs/123456"; // Example URL

	console.log(
		`Original description: "${shortDescription}" (${shortDescription.length} chars)`,
	);

	try {
		const fullDescription = await fetchFullJobDescription(
			jobUrl,
			shortDescription,
		);
		console.log(
			`Fetched description: "${fullDescription.substring(0, 200)}..." (${fullDescription.length} chars)`,
		);

		if (fullDescription.length > shortDescription.length) {
			console.log("✅ SUCCESS: Full description fetching worked!");
		} else {
			console.log(
				"⚠️  No improvement: Description stayed the same or got shorter",
			);
		}
	} catch (error) {
		console.error("❌ Error:", error.message);
	}
}

testDescriptionFetching();
