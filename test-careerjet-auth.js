// Test script to diagnose CareerJet API authentication
require("dotenv").config({ path: ".env.local" });

const CAREERJET_API_KEY = process.env.CAREERJET_API_KEY;

if (!CAREERJET_API_KEY) {
	console.error("❌ CAREERJET_API_KEY not set in .env.local");
	process.exit(1);
}

async function testCareerJetAuth() {
	console.log("🔍 CareerJet API V4 Authentication Test\n");

	// Test data
	const BASE_URL = "https://search.api.careerjet.net/v4/query";
	const auth = Buffer.from(`${CAREERJET_API_KEY}:`).toString("base64");

	console.log("📝 Configuration:");
	console.log(
		`   API Key (first 8 chars): ${CAREERJET_API_KEY.substring(0, 8)}...`,
	);
	console.log(`   Endpoint: ${BASE_URL}`);
	console.log(`   Auth Header: Basic ${auth}`);
	console.log("");

	// Build test request
	const params = new URLSearchParams({
		locale_code: "en_GB",
		location: "London",
		keywords: "internship",
		user_ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
		user_agent: "Mozilla/5.0 JobPing/1.0",
		pagesize: "10",
		page: "1",
		sort: "date",
		contracttype: "p",
	});

	const url = `${BASE_URL}?${params.toString()}`;

	console.log("🌐 Request Details:");
	console.log(`   URL: ${url.substring(0, 100)}...`);
	console.log(`   Headers:`);
	console.log(`      User-Agent: Mozilla/5.0 JobPing/1.0`);
	console.log(`      Accept: application/json`);
	console.log(`      Authorization: Basic ${auth}`);
	console.log("");

	console.log("📤 Sending request...");

	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 JobPing/1.0",
				Accept: "application/json",
				Authorization: `Basic ${auth}`,
				Referer: "https://www.careerjet.com",
			},
		});

		console.log("");
		console.log(
			`✅ Response Status: ${response.status} ${response.statusText}`,
		);
		console.log(`   Headers: `);
		console.log(`      Content-Type: ${response.headers.get("content-type")}`);
		console.log(
			`      Content-Length: ${response.headers.get("content-length")}`,
		);

		// Try to parse response
		const contentType = response.headers.get("content-type");
		let data;

		if (contentType && contentType.includes("application/json")) {
			data = await response.json();
		} else {
			const text = await response.text();
			data = text.substring(0, 500);
		}

		console.log("");
		if (response.ok) {
			console.log("🎉 SUCCESS! API is working");
			if (typeof data === "object" && data.jobs) {
				console.log(
					`   Found ${data.jobs.length} jobs (out of ${data.hits || "?"} total)`,
				);
			}
		} else {
			console.log(`❌ ERROR: ${response.status} ${response.statusText}`);
			console.log("");
			console.log("Response body:");
			console.log(JSON.stringify(data, null, 2).substring(0, 500));
		}

		return response.ok;
	} catch (error) {
		console.error("❌ Network Error:", error.message);
		return false;
	}
}

testCareerJetAuth()
	.then((success) => {
		process.exit(success ? 0 : 1);
	})
	.catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
