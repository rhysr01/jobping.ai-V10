import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

/**
 * Process embedding queue
 * Cron job that generates embeddings for jobs without them
 * Runs every 5 minutes to gradually populate embeddings
 */
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
	try {
		console.log("[Embedding Queue] Starting embedding processing...");

		// Verify authorization for this cron job
		const authHeader = request.headers.get("authorization");
		if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			// Allow unauthenticated calls from Vercel cron for backward compatibility
			if (!request.nextUrl.pathname.includes("process-embedding-queue")) {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}
		}

		// Initialize clients
		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!,
		);

		const openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		// Step 1: Fetch jobs without embeddings (batch of 50 to stay within rate limits)
		console.log("[Embedding Queue] Fetching jobs without embeddings...");
		const { data: jobsWithoutEmbeddings, error: fetchError } = await supabase
			.from("jobs")
			.select("id, title, description, embedding")
			.is("embedding", null)
			.eq("is_active", true)
			.eq("status", "active")
			.limit(50);

		if (fetchError) {
			console.error("[Embedding Queue] Fetch error:", fetchError);
			throw fetchError;
		}

		if (!jobsWithoutEmbeddings || jobsWithoutEmbeddings.length === 0) {
			console.log("[Embedding Queue] No jobs without embeddings found");
			return NextResponse.json({
				success: true,
				message: "No jobs to process",
				processed: 0,
				timestamp: new Date().toISOString(),
			});
		}

		console.log(
			`[Embedding Queue] Processing ${jobsWithoutEmbeddings.length} jobs...`,
		);

		// Step 2: Prepare text for embedding (title + description)
		const textsToEmbed = jobsWithoutEmbeddings.map((job) => {
			const text = `${job.title || ""} ${job.description || ""}`.trim();
			// Truncate to prevent token limit errors (8192 token limit for text-embedding-3-small)
			// Conservative estimate: 1 token ≈ 4 characters, so 8000 tokens ≈ 32,000 characters
			// Keep some buffer to ensure we stay under limit
			const MAX_CHARS = 30000; // Conservative: ~7500 tokens (well under 8192 limit)
			return text.length > MAX_CHARS
				? text.substring(0, MAX_CHARS - 100) + "..."
				: text;
		});

		// Step 3: Generate embeddings using OpenAI
		console.log(
			`[Embedding Queue] Calling OpenAI for embeddings (${textsToEmbed.length} jobs)...`,
		);
		let embeddingsData;
		try {
			const response = await openai.embeddings.create({
				model: "text-embedding-3-small",
				input: textsToEmbed,
				dimensions: 1536,
			});
			embeddingsData = response.data;
		} catch (openaiError: any) {
			console.error(
				"[Embedding Queue] OpenAI error:",
				openaiError.message || openaiError,
			);
			throw new Error(`OpenAI embedding failed: ${openaiError.message}`);
		}

		// Step 4: Store embeddings back to database
		console.log(`[Embedding Queue] Storing ${embeddingsData.length} embeddings...`);
		let successCount = 0;
		const errors = [];

		for (let i = 0; i < embeddingsData.length; i++) {
			const embedding = embeddingsData[i];
			const job = jobsWithoutEmbeddings[i];

			try {
				// Store as a JSON-compatible array for pgvector
				const embeddingVector = embedding.embedding;

				const { error: updateError } = await supabase
					.from("jobs")
					.update({
						embedding: embeddingVector,
						updated_at: new Date().toISOString(),
					})
					.eq("id", job.id);

				if (updateError) {
					errors.push(`Job ${job.id}: ${updateError.message}`);
					console.error(`[Embedding Queue] Error updating job ${job.id}:`, updateError);
				} else {
					successCount++;
				}
			} catch (error: any) {
				errors.push(`Job ${job.id}: ${error.message}`);
				console.error(`[Embedding Queue] Error processing job ${job.id}:`, error);
			}
		}

		console.log(
			`[Embedding Queue] Processing complete. Successfully processed: ${successCount}/${embeddingsData.length}`,
		);

		// Return summary
		const result = {
			success: successCount > 0,
			message: `Processed embeddings for ${successCount} jobs`,
			processed: successCount,
			total: embeddingsData.length,
			errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Only return first 5 errors
			timestamp: new Date().toISOString(),
		};

		// Log to Sentry if there were errors
		if (errors.length > 0) {
			console.warn(
				`[Embedding Queue] ${errors.length} errors occurred during processing`,
			);
		}

		return NextResponse.json(result);
	} catch (error: any) {
		console.error("[Embedding Queue] Fatal error:", error);
		return NextResponse.json(
			{
				success: false,
				error: error.message || "Failed to process embedding queue",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}

// Also support GET for health checks
export async function GET(_request: NextRequest) {
	return NextResponse.json({
		status: "ok",
		message: "Embedding queue processor is available",
		timestamp: new Date().toISOString(),
	});
}
