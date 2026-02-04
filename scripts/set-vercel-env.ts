#!/usr/bin/env tsx

/**
 * Script to help set Vercel environment variables
 * This provides the exact values you need to copy-paste into Vercel
 */

import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";

// Load environment variables
dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

const requiredVars = [
	{
		name: "NEXT_PUBLIC_SUPABASE_URL",
		value: process.env.NEXT_PUBLIC_SUPABASE_URL,
	},
	{
		name: "SUPABASE_SERVICE_ROLE_KEY",
		value: process.env.SUPABASE_SERVICE_ROLE_KEY,
	},
	{
		name: "RESEND_API_KEY",
		value: process.env.RESEND_API_KEY,
	},
	{
		name: "INTERNAL_API_HMAC_SECRET",
		value: process.env.INTERNAL_API_HMAC_SECRET,
	},
	{
		name: "SYSTEM_API_KEY",
		value: process.env.SYSTEM_API_KEY,
	},
];

console.log("📋 Required Environment Variables for Vercel\n");
console.log("Copy these values into: Vercel Dashboard → jobping-ai-v10 → Settings → Environment Variables\n");
console.log("⚠️  IMPORTANT: Add them at the PROJECT level, not Team level\n");
console.log("=" .repeat(80));

requiredVars.forEach((envVar, index) => {
	console.log(`\n${index + 1}. ${envVar.name}`);
	console.log("   Value:", envVar.value || "❌ NOT SET IN .env.local");
	console.log("   Environments: ✅ Production ✅ Preview ✅ Development");
});

console.log("\n" + "=".repeat(80));
console.log("\n📝 Steps:");
console.log("   1. Go to: https://vercel.com/dashboard");
console.log("   2. Select project: jobping-ai-v10");
console.log("   3. Go to: Settings → Environment Variables");
console.log("   4. Click 'Add Environment Variable'");
console.log("   5. For EACH variable above:");
console.log("      - Paste the Name exactly as shown");
console.log("      - Paste the Value");
console.log("      - Select ALL environments: Production, Preview, Development");
console.log("      - Click 'Save'");
console.log("   6. After adding all 5 variables, redeploy your project");
console.log("\n");
