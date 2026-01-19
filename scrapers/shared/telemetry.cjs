// API request counter with file persistence
const fs = require("node:fs");
const path = require("node:path");
const TELEMETRY_FILE = path.join(__dirname, "../../.api-telemetry.json");

function loadTelemetryData() {
	try {
		if (fs.existsSync(TELEMETRY_FILE)) {
			const data = fs.readFileSync(TELEMETRY_FILE, "utf8");
			const parsed = JSON.parse(data);
			return new Map(Object.entries(parsed));
		}
	} catch (error) {
		console.warn("⚠️  Failed to load telemetry data:", error.message);
	}
	return new Map();
}

function saveTelemetryData() {
	try {
		const data = Object.fromEntries(apiRequestCounts);
		fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(data, null, 2));
	} catch (error) {
		console.warn("⚠️  Failed to save telemetry data:", error.message);
	}
}

const apiRequestCounts = loadTelemetryData();

function recordApiRequest(apiName, endpoint = "", success = true) {
	try {
		const dateKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
		const key = `${apiName}__${dateKey}`; // Use double underscore to avoid conflicts

		if (!apiRequestCounts.has(key)) {
			apiRequestCounts.set(key, { total: 0, success: 0, errors: 0 });
		}

		const counts = apiRequestCounts.get(key);
		counts.total++;

		if (success) {
			counts.success++;
		} else {
			counts.errors++;
		}

		// Save to file after each update
		saveTelemetryData();

		// Log API request metrics
		const payload = {
			timestamp: new Date().toISOString(),
			level: success ? "info" : "warn",
			message: `API: ${apiName} request ${success ? "success" : "error"}`,
			context: {
				operation: "api-request",
				component: apiName,
				metadata: {
					endpoint,
					dailyTotal: counts.total,
					dailySuccess: counts.success,
					dailyErrors: counts.errors,
					date: dateKey,
				},
			},
			environment: process.env.NODE_ENV || "development",
			service: "jobping",
		};

		console.log(JSON.stringify(payload));
	} catch (error) {
		console.warn("⚠️  Failed to record API telemetry:", error?.message || error);
	}
}

function getApiUsageReport() {
	// Reload data from file to get latest updates from child processes
	const freshData = loadTelemetryData();
	const report = {};
	for (const [key, counts] of freshData.entries()) {
		const [apiName, date] = key.split("__");
		if (!report[apiName]) {
			report[apiName] = {};
		}
		report[apiName][date] = counts;
	}
	return report;
}

function recordScraperRun(scraper, jobsFound, duration, errors = 0) {
	try {
		const payload = {
			timestamp: new Date().toISOString(),
			level: "info",
			message: "METRIC: scraper.jobs.found",
			context: {
				operation: "scraper-execution",
				component: scraper,
				duration,
				metadata: {
					errors,
					successRate: errors === 0 ? 100 : Math.max(0, 100 - errors * 10),
					metric: {
						name: "scraper.jobs.found",
						value: jobsFound,
						unit: "count",
					},
				},
			},
			environment: process.env.NODE_ENV || "development",
			service: "jobping",
		};

		console.log(JSON.stringify(payload));
	} catch (error) {
		console.warn(
			"⚠️  Failed to record scraper telemetry:",
			error?.message || error,
		);
	}
}

module.exports = {
	recordScraperRun,
	recordApiRequest,
	getApiUsageReport,
};
