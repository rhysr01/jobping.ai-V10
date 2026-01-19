require("dotenv").config({ path: "./.env.local" });

// Test premium signup API
async function testPremiumSignup() {
	const testData = {
		email: `test-premium-${Date.now()}@example.com`,
		fullName: "Test Premium User",
		cities: ["London", "Dublin"],
		languages: ["English"],
		careerPath: "entry",
		roles: ["software-engineer"],
		workEnvironment: ["Remote", "Hybrid"],
		entryLevelPreferences: ["graduate"],
		visaStatus: "EU",
		industries: ["Technology"],
		companySizePreference: "any",
		skills: ["JavaScript", "React"],
		targetCompanies: [],
		companyTypes: [],
	};

	console.log("🧪 Testing premium signup API...");
	console.log("Test data:", JSON.stringify(testData, null, 2));

	try {
		const response = await fetch("http://localhost:3000/api/signup", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-csrf-token": "jobping-request",
			},
			body: JSON.stringify(testData),
		});

		const result = await response.json();
		console.log("\n📡 API Response:");
		console.log("Status:", response.status);
		console.log("Response:", JSON.stringify(result, null, 2));

		if (response.ok) {
			console.log("\n✅ Signup successful!");
			console.log("Redirect URL:", result.redirectUrl);
			console.log("Matches count:", result.matchesCount);
		} else {
			console.log("\n❌ Signup failed!");
			console.log("Error:", result.error);
		}
	} catch (error) {
		console.error("\n💥 Request failed:", error.message);
	}
}

// Check if dev server is running
async function checkDevServer() {
	try {
		const response = await fetch("http://localhost:3000/api/health");
		if (response.ok) {
			console.log("✅ Dev server is running");
			return true;
		}
	} catch (_error) {
		console.log("❌ Dev server not running. Please start with: npm run dev");
		return false;
	}
}

async function main() {
	const serverRunning = await checkDevServer();
	if (!serverRunning) {
		process.exit(1);
	}

	await testPremiumSignup();
}

main();
