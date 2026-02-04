require('dotenv').config({ path: '.env.local' });
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const targetUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/process-embedding-queue`
    : `http://localhost:${process.env.PORT || 3000}/api/process-embedding-queue`;

if (!process.env.CRON_SECRET) {
    console.error('❌ CRITICAL: CRON_SECRET is not set. Cannot securely trigger embedding queue.');
    process.exit(1);
}

console.log(`[Embedding Trigger] Target URL: ${targetUrl}`);
console.log(`[Embedding Trigger] CRON_SECRET exists: ${!!process.env.CRON_SECRET}`);

execAsync(`curl -s -X POST -H \"Content-Type: application/json\" -H \"Authorization: Bearer ${process.env.CRON_SECRET}\" \"${targetUrl}\"`)
    .then(({ stdout, stderr }) => {
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log('✅ Embedding refresh trigger successful.');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Embedding refresh trigger failed:', error.message);
        process.exit(1);
    });