"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { Badge } from "./badge";

interface JobStatsDisclaimerProps {
	className?: string;
}

export function JobStatsDisclaimer({
	className = "",
}: JobStatsDisclaimerProps) {
	const jobSources = [
		"Indeed",
		"Glassdoor",
		"Adzuna",
		"Jooble",
		"Reed",
		"Arbeitnow",
		"Company Pages",
	];

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ delay: 0.5, duration: 0.6 }}
			className={`text-center space-y-4 ${className}`}
		>
			{/* Enhanced Disclaimer */}
			<div className="max-w-3xl mx-auto">
				<div className="inline-flex items-start gap-3 px-6 py-4 rounded-xl glass-card elevation-1 border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm">
					<div className="flex-shrink-0 mt-0.5">
						<Info className="h-5 w-5 text-blue-400" />
					</div>

					<div className="text-left space-y-3">
						<p className="text-sm text-zinc-300 leading-relaxed">
							<span className="font-medium text-white">JobPing</span> aggregates
							jobs from trusted public sources and company career pages. We are
							not affiliated with these companies and match you with available
							listings.
						</p>

						{/* Job Sources Badges */}
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-xs text-zinc-400 font-medium">
								Sources:
							</span>
							{jobSources.map((source) => (
								<Badge
									key={source}
									variant="secondary"
									className="text-xs bg-zinc-800/60 text-zinc-300 border-zinc-700/50 hover:bg-zinc-700/60 transition-colors"
								>
									{source}
								</Badge>
							))}
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
