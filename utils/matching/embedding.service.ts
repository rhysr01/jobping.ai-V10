/**
 * Embedding Service for Job Matching
 * Handles generation and storage of job embeddings using OpenAI
 */

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { ENV } from "@/lib/env";

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: ENV.OPENAI_API_KEY || "",
});

export interface JobEmbedding {
	job_hash: string;
	embedding: number[];
	created_at: string;
}

export class EmbeddingService {
	/**
	 * Generate embeddings for a batch of jobs
	 */
	static async batchGenerateJobEmbeddings(
		jobs: any[],
	): Promise<Map<string, number[]>> {
		const embeddings = new Map<string, number[]>();

		for (const job of jobs) {
			try {
				// Create a text representation of the job for embedding
				const jobText =
					`${job.title || ""} ${job.company || ""} ${job.description || ""} ${job.location || ""}`.trim();

				if (!jobText || jobText.length < 10) {
					console.warn(
						`⚠️  Skipping job ${job.job_hash} - insufficient content for embedding`,
					);
					continue;
				}

				// Truncate to prevent token limit errors (8192 token limit for text-embedding-3-small)
				// Conservative estimate: 1 token ≈ 4 characters, so 8000 tokens ≈ 32,000 characters
				// Keep some buffer to ensure we stay under limit
				const MAX_CHARS = 30000; // Conservative: ~7500 tokens (well under 8192 limit)
				const truncatedText =
					jobText.length > MAX_CHARS
						? jobText.substring(0, MAX_CHARS - 100) + "..."
						: jobText;

				// Generate embedding using OpenAI
				const response = await openai.embeddings.create({
					model: "text-embedding-3-small",
					input: truncatedText,
					encoding_format: "float",
				});

				const embedding = response.data[0]?.embedding;
				if (embedding && embedding.length > 0) {
					embeddings.set(job.job_hash, embedding);
				} else {
					console.warn(`⚠️  No embedding generated for job ${job.job_hash}`);
				}
			} catch (error) {
				console.error(
					`❌ Failed to generate embedding for job ${job.job_hash}:`,
					error,
				);
				// Continue with other jobs
			}
		}

		return embeddings;
	}

	/**
	 * Store job embeddings in the database
	 * @param embeddings Map of job_hash to embedding vector
	 * @param jobs Array of job objects with id and job_hash
	 */
	static async storeJobEmbeddings(
		embeddings: Map<string, number[]>,
		jobs: Array<{ id: string; job_hash: string }>,
	): Promise<number> {
		if (embeddings.size === 0) {
			console.log("📊 No embeddings to store");
			return 0;
		}

		const supabase = createClient(
			ENV.NEXT_PUBLIC_SUPABASE_URL,
			ENV.SUPABASE_SERVICE_ROLE_KEY,
		);

		let successCount = 0;
		const errors: string[] = [];

		// Create a map of job_hash to job_id for quick lookup
		const hashToId = new Map<string, string>();
		for (const job of jobs) {
			if (job.job_hash) {
				hashToId.set(job.job_hash, job.id);
			}
		}

		// Store each embedding
		for (const [jobHash, embedding] of embeddings.entries()) {
			const jobId = hashToId.get(jobHash);
			if (!jobId) {
				console.warn(`⚠️  No job ID found for hash ${jobHash}`);
				continue;
			}

			try {
				const { error: updateError } = await supabase
					.from("jobs")
					.update({
						embedding: embedding,
						updated_at: new Date().toISOString(),
					})
					.eq("id", jobId);

				if (updateError) {
					errors.push(`Job ${jobId}: ${updateError.message}`);
					console.error(
						`❌ Error storing embedding for job ${jobId}:`,
						updateError,
					);
				} else {
					successCount++;
				}
			} catch (error: any) {
				errors.push(`Job ${jobId}: ${error.message}`);
				console.error(`❌ Error storing embedding for job ${jobId}:`, error);
			}
		}

		console.log(
			`📊 Stored ${successCount}/${embeddings.size} embeddings successfully`,
		);
		if (errors.length > 0) {
			console.warn(`⚠️  ${errors.length} errors occurred during storage`);
		}

		return successCount;
	}

	/**
	 * Check embedding coverage across all jobs
	 */
	static async checkEmbeddingCoverage(): Promise<{
		coverage: number;
		withEmbeddings: number;
		total: number;
	}> {
		const supabase = createClient(
			ENV.NEXT_PUBLIC_SUPABASE_URL,
			ENV.SUPABASE_SERVICE_ROLE_KEY,
		);

		const { count: total } = await supabase
			.from("jobs")
			.select("*", { count: "exact", head: true })
			.eq("is_active", true)
			.eq("status", "active");

		const { count: withEmbeddings } = await supabase
			.from("jobs")
			.select("*", { count: "exact", head: true })
			.eq("is_active", true)
			.eq("status", "active")
			.not("embedding", "is", null);

		const totalCount = total || 0;
		const withEmbeddingsCount = withEmbeddings || 0;
		const coverage = totalCount > 0 ? withEmbeddingsCount / totalCount : 0;

		return {
			coverage,
			withEmbeddings: withEmbeddingsCount,
			total: totalCount,
		};
	}
}

export const embeddingService = EmbeddingService;
