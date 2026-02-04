#!/usr/bin/env tsx

/**
 * Comprehensive script to ensure Vercel environment variables are set correctly
 * Uses Vercel MCP to check and optionally set environment variables
 */

import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";
import { VercelMCP } from "./mcps/vercel-mcp.ts";

// Load environment variables from .env.local
dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

// Required environment variables from lib/env.ts
const REQUIRED_VARS = [
	{
		name: "NEXT_PUBLIC_SUPABASE_URL",
		validation: (val: string) => {
			if (!val) return { valid: false, error: "Missing" };
			if (!val.startsWith("https://")) return { valid: false, error: "Must be HTTPS URL" };
			return { valid: true };
		},
	},
	{
		name: "SUPABASE_SERVICE_ROLE_KEY",
		validation: (val: string) => {
			if (!val) return { valid: false, error: "Missing" };
			if (val.length < 20) return { valid: false, error: "Too short (min 20 chars)" };
			return { valid: true };
		},
	},
	{
		name: "RESEND_API_KEY",
		validation: (val: string) => {
			if (!val) return { valid: false, error: "Missing" };
			if (!val.startsWith("re_")) return { valid: false, error: "Must start with 're_'" };
			return { valid: true };
		},
	},
	{
		name: "INTERNAL_API_HMAC_SECRET",
		validation: (val: string) => {
			if (!val) return { valid: false, error: "Missing" };
			if (val.length < 32) return { valid: false, error: "Too short (min 32 chars)" };
			return { valid: true };
		},
	},
	{
		name: "SYSTEM_API_KEY",
		validation: (val: string) => {
			if (!val) return { valid: false, error: "Missing" };
			if (val.length < 10) return { valid: false, error: "Too short (min 10 chars)" };
			return { valid: true };
		},
	},
];

// Optional but recommended variables
const RECOMMENDED_VARS = [
	{
		name: "OPENAI_API_KEY",
		validation: (val: string) => {
			if (!val) return { valid: false, error: "Missing (optional but recommended)" };
			if (!val.startsWith("sk-")) return { valid: false, error: "Must start with 'sk-'" };
			return { valid: true };
		},
	},
	{
		name: "REDIS_URL",
		validation: (val: string) => {
			if (!val) return { valid: false, error: "Missing (optional)" };
			if (!val.startsWith("redis://")) return { valid: false, error: "Must be Redis URL" };
			return { valid: true };
		},
	},
	{
		name: "SENTRY_DSN",
		validation: (val: string) => {
			if (!val) return { valid: false, error: "Missing (optional)" };
			if (!val.startsWith("https://")) return { valid: false, error: "Must be HTTPS URL" };
			return { valid: true };
		},
	},
	{
		name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
		validation: (val: string) => {
			if (!val) return { valid: false, error: "Missing (optional)" };
			if (val.length < 20) return { valid: false, error: "Too short (min 20 chars)" };
			return { valid: true };
		},
	},
];

interface EnvVarStatus {
	name: string;
	set: boolean;
	environments: string[];
	hasAllEnvironments: boolean;
	value?: string;
	validation?: { valid: boolean; error?: string };
}

async function getProjectId(vercel: VercelMCP): Promise<string | null> {
	const projectsResult = await vercel.getProjects({});
	if (projectsResult.isError) {
		console.error("❌ Failed to get projects");
		console.error(projectsResult.content[0].text);
		return null;
	}

	// Try to find jobping project
	const text = projectsResult.content[0].text;
	const match = text.match(/ID: (prj_\w+)/);
	if (match) {
		return match[1];
	}

	return null;
}

async function checkEnvironmentVariables(
	vercel: VercelMCP,
	projectId: string,
): Promise<Map<string, EnvVarStatus>> {
	const envResult = await vercel.getEnvironmentVariables({ projectId });
	if (envResult.isError) {
		throw new Error(envResult.content[0].text);
	}

	const statusMap = new Map<string, EnvVarStatus>();

	// Parse the environment variables from the response
	// The response format is: "✅ VAR_NAME (REQUIRED)\n   Environments: Production, Preview, Development"
	const text = envResult.content[0].text;
	const lines = text.split("\n");

	let currentVar: { name?: string; environments?: string[]; set?: boolean } = {};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		
		// Match variable name line: "✅ VAR_NAME (REQUIRED)" or "   VAR_NAME"
		const varMatch = line.match(/^[✅⚠️❌\s]+([A-Z_][A-Z0-9_]*)/);
		if (varMatch) {
			if (currentVar.name) {
				// Save previous variable
				statusMap.set(currentVar.name, {
					name: currentVar.name,
					set: currentVar.set ?? false,
					environments: currentVar.environments || [],
					hasAllEnvironments:
						currentVar.environments?.includes("Production") &&
						currentVar.environments?.includes("Preview"),
				});
			}
			currentVar = {
				name: varMatch[1],
				set: !line.includes("❌"),
			};
			
			// Look ahead for environments line (usually next line)
			if (i + 1 < lines.length) {
				const nextLine = lines[i + 1];
				const envMatch = nextLine.match(/Environments:\s*(.+)/);
				if (envMatch) {
					currentVar.environments = envMatch[1]
						.split(",")
						.map((e) => e.trim())
						.filter(Boolean);
					i++; // Skip the environments line
				}
			}
		}
	}

	// Save last variable
	if (currentVar.name) {
		statusMap.set(currentVar.name, {
			name: currentVar.name,
			set: currentVar.set ?? false,
			environments: currentVar.environments || [],
			hasAllEnvironments:
				currentVar.environments?.includes("Production") &&
				currentVar.environments?.includes("Preview"),
		});
	}

	return statusMap;
}

function validateVariable(name: string, value: string | undefined): { valid: boolean; error?: string } {
	const allVars = [...REQUIRED_VARS, ...RECOMMENDED_VARS];
	const varDef = allVars.find((v) => v.name === name);
	if (!varDef) {
		return { valid: true }; // Unknown variable, assume valid
	}
	return varDef.validation(value || "");
}

async function main() {
	const vercel = new VercelMCP();

	console.log("🔍 Ensuring Vercel Environment Variables are Set Correctly\n");
	console.log("=" .repeat(80));
	console.log();

	// Get project ID
	console.log("📋 Step 1: Finding Vercel project...\n");
	const projectId = await getProjectId(vercel);
	if (!projectId) {
		console.error("❌ Could not find project ID");
		process.exit(1);
	}
	console.log(`✅ Found project ID: ${projectId}\n`);

	// Check current environment variables
	console.log("📋 Step 2: Checking current environment variables...\n");
	const envStatus = await checkEnvironmentVariables(vercel, projectId);

	// Validate required variables
	console.log("📋 Step 3: Validating required variables...\n");
	const issues: Array<{ name: string; issue: string; severity: "error" | "warning" }> = [];

	for (const varDef of REQUIRED_VARS) {
		const status = envStatus.get(varDef.name);
		const localValue = process.env[varDef.name];

		if (!status || !status.set) {
			issues.push({
				name: varDef.name,
				issue: "Variable not set in Vercel",
				severity: "error",
			});
		} else if (!status.hasAllEnvironments) {
			issues.push({
				name: varDef.name,
				issue: `Not set for all environments. Current: ${status.environments.join(", ")}`,
				severity: "error",
			});
		} else {
			// Validate format if we have a local value to compare
			if (localValue) {
				const validation = validateVariable(varDef.name, localValue);
				if (!validation.valid) {
					issues.push({
						name: varDef.name,
						issue: `Local value validation failed: ${validation.error}`,
						severity: "warning",
					});
				}
			}
		}
	}

	// Check recommended variables
	for (const varDef of RECOMMENDED_VARS) {
		const status = envStatus.get(varDef.name);
		const localValue = process.env[varDef.name];

		if (!status || !status.set) {
			issues.push({
				name: varDef.name,
				issue: "Variable not set (recommended)",
				severity: "warning",
			});
		} else if (localValue) {
			const validation = validateVariable(varDef.name, localValue);
			if (!validation.valid) {
				issues.push({
					name: varDef.name,
					issue: `Local value validation failed: ${validation.error}`,
					severity: "warning",
				});
			}
		}
	}

	// Print summary
	console.log("📊 Summary:\n");
	console.log("Required Variables:");
	for (const varDef of REQUIRED_VARS) {
		const status = envStatus.get(varDef.name);
		if (status && status.set && status.hasAllEnvironments) {
			console.log(`  ✅ ${varDef.name} - Set for all environments`);
		} else if (status && status.set) {
			console.log(
				`  ⚠️  ${varDef.name} - Set but missing environments: ${status.environments.join(", ")}`,
			);
		} else {
			console.log(`  ❌ ${varDef.name} - NOT SET`);
		}
	}

	console.log("\nRecommended Variables:");
	for (const varDef of RECOMMENDED_VARS) {
		const status = envStatus.get(varDef.name);
		if (status && status.set && status.hasAllEnvironments) {
			console.log(`  ✅ ${varDef.name} - Set for all environments`);
		} else if (status && status.set) {
			console.log(
				`  ⚠️  ${varDef.name} - Set but missing environments: ${status.environments.join(", ")}`,
			);
		} else {
			console.log(`  ⚠️  ${varDef.name} - Not set (optional)`);
		}
	}

	// Print issues
	if (issues.length > 0) {
		console.log("\n" + "=" .repeat(80));
		console.log("\n⚠️  Issues Found:\n");

		const errors = issues.filter((i) => i.severity === "error");
		const warnings = issues.filter((i) => i.severity === "warning");

		if (errors.length > 0) {
			console.log("❌ Errors (must fix):");
			for (const issue of errors) {
				console.log(`   - ${issue.name}: ${issue.issue}`);
			}
		}

		if (warnings.length > 0) {
			console.log("\n⚠️  Warnings (recommended to fix):");
			for (const issue of warnings) {
				console.log(`   - ${issue.name}: ${issue.issue}`);
			}
		}

		console.log("\n" + "=" .repeat(80));
		console.log("\n📝 How to Fix:\n");
		console.log("   1. Go to: https://vercel.com/dashboard");
		console.log(`   2. Select project: jobping-ai-v10`);
		console.log("   3. Go to: Settings → Environment Variables");
		console.log("   4. For each missing variable:");
		console.log("      - Click 'Add Environment Variable'");
		console.log("      - Enter the exact variable name");
		console.log("      - Copy the value from your .env.local file");
		console.log("      - Select ALL environments: ✅ Production ✅ Preview ✅ Development");
		console.log("      - Click 'Save'");
		console.log("   5. After adding variables, redeploy your project");
		console.log("      - Go to Deployments tab");
		console.log("      - Click 'Redeploy' on latest deployment");
		console.log("\n💡 Tip: Run 'npm run set-vercel-env' to see values from .env.local");
	} else {
		console.log("\n" + "=" .repeat(80));
		console.log("\n✅ All environment variables are properly configured!");
		console.log("\n💡 If you're still experiencing issues:");
		console.log("   - Make sure you've redeployed after adding variables");
		console.log("   - Check that variables are set at PROJECT level, not Team level");
		console.log("   - Verify variable names match exactly (case-sensitive)");
	}

	console.log();
}

main().catch((error) => {
	console.error("❌ Error:", error.message);
	process.exit(1);
});
