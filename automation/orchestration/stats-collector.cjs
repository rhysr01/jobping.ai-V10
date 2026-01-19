/**
 * Stats Collector - Infrastructure Layer
 *
 * Collects statistics from database. This is "Muscle" - it knows
 * HOW to query the database, but not WHY we're checking quotas.
 */

/**
 * Collect cycle statistics since a given timestamp
 *
 * @param {Object} supabase - Supabase client instance
 * @param {string} sinceIso - ISO timestamp to collect stats from
 * @returns {Promise<Object>} Cycle statistics with {total: number, perSource: Object}
 */
async function collectCycleStats(supabase, sinceIso) {
	try {
		const { data, error } = await supabase
			.from("jobs")
			.select("job_hash, source")
			.gte("created_at", sinceIso);

		if (error) {
			throw error;
		}

		const uniqueHashes = new Set();
		const perSource = {};

		(data || []).forEach((row) => {
			if (!row?.job_hash) return;
			uniqueHashes.add(row.job_hash);
			const sourceKey = row.source || "unknown";
			perSource[sourceKey] = (perSource[sourceKey] || 0) + 1;
		});

		return {
			total: uniqueHashes.size,
			perSource,
		};
	} catch (error) {
		console.error("⚠️  Failed to collect cycle stats:", error.message);
		return { total: 0, perSource: {} };
	}
}

module.exports = {
	collectCycleStats,
};
