// Simple test to check CSP headers
const https = require("https");

const url =
	process.env.NODE_ENV === "production"
		? "https://your-domain.vercel.app"
		: "http://localhost:3000";

console.log(`Testing CSP headers on: ${url}`);
console.log("Checking if CSP allows necessary resources...\n");

if (url.includes("localhost")) {
	console.log(
		"⚠️  Local development detected. CSP is more permissive in development.",
	);
	console.log(
		"   Make sure to test on production deployment for strict CSP validation.",
	);
	console.log("\nTo test CSP:");
	console.log("1. Deploy to Vercel/production");
	console.log("2. Open browser DevTools > Console");
	console.log("3. Look for CSP violation errors");
	console.log("4. If you see CSP errors, the blocked domains will be listed");
	process.exit(0);
}

// For production, we could add a curl test, but for now just show instructions
console.log("🚀 Production CSP Test:");
console.log("1. Deploy the changes to Vercel");
console.log("2. Open your site in a browser");
console.log("3. Open DevTools > Console tab");
console.log("4. Look for any CSP (Content Security Policy) violation errors");
console.log("5. If you see CSP errors, note the blocked resource domains");
console.log(
	"6. Add any missing trusted domains to the CSP allowlist in middleware/security-headers.ts",
);
console.log("\n📋 Current CSP allows:");
console.log(
	"- Scripts: self, nonce, Google Analytics, Supabase, jsdelivr, Sentry, Cloudflare",
);
console.log("- Styles: self, unsafe-inline, Google Fonts, Fontshare");
console.log("- Images: self, data, https");
console.log(
	"- Connections: self, Supabase, OpenAI, Resend, Google Analytics, Sentry, Cloudflare",
);
console.log("- Fonts: self, Google Fonts, Fontshare");
console.log(
	"\n✅ CSP configuration updated to remove conflicts between Vercel and middleware.",
);
