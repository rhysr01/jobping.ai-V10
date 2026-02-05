"use client";

import { motion } from "framer-motion";
import { Info, Globe, Search, Eye, Target, Zap, Award, Network } from "lucide-react";

interface JobStatsDisclaimerProps {
	className?: string;
}

interface JobSource {
	name: string;
	icon: React.ReactNode;
	description: string;
	category: "job-board" | "career-site" | "aggregator";
}

export function JobStatsDisclaimer({
	className = "",
}: JobStatsDisclaimerProps) {
	const jobSources: JobSource[] = [
		{
			name: "Indeed",
			icon: <Search className="h-4 w-4" />,
			description: "World's largest job site",
			category: "job-board"
		},
		{
			name: "Glassdoor",
			icon: <Eye className="h-4 w-4" />,
			description: "Company reviews & salaries",
			category: "job-board"
		},
		{
			name: "Adzuna",
			icon: <Target className="h-4 w-4" />,
			description: "Global job search engine",
			category: "aggregator"
		},
		{
			name: "Jooble",
			icon: <Globe className="h-4 w-4" />,
			description: "International job board",
			category: "job-board"
		},
		{
			name: "Reed",
			icon: <Award className="h-4 w-4" />,
			description: "UK's leading job site",
			category: "job-board"
		},
		{
			name: "Arbeitnow",
			icon: <Zap className="h-4 w-4" />,
			description: "European tech jobs",
			category: "job-board"
		},
		{
			name: "Company Pages",
			icon: <Network className="h-4 w-4" />,
			description: "Direct from employers",
			category: "career-site"
		},
	];

	const containerVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.6,
				delay: 0.3,
				staggerChildren: 0.1
			}
		}
	};

	const itemVariants = {
		hidden: { opacity: 0, scale: 0.95 },
		visible: { opacity: 1, scale: 1 }
	};

	return (
		<motion.div
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, margin: "-100px" }}
			variants={containerVariants}
			className={`text-center space-y-6 ${className}`}
		>
			{/* Enhanced Disclaimer */}
			<div className="max-w-4xl mx-auto">
				<motion.div 
					variants={itemVariants}
					className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-800/50 backdrop-blur-xl border border-zinc-800/60 shadow-2xl"
				>
					{/* Background Pattern - matching hero section */}
					<div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
					<div className="absolute top-0 left-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
					<div className="absolute bottom-0 right-1/4 w-48 h-48 bg-cyan-500/8 rounded-full blur-3xl" />
					
					<div className="relative px-8 py-8">
						{/* Header */}
						<div className="flex items-center justify-center gap-3 mb-6">
							<div className="flex-shrink-0 p-2 rounded-full bg-emerald-500/20 border border-emerald-500/30">
								<Info className="h-5 w-5 text-emerald-400" />
							</div>
							<h3 className="text-lg font-semibold text-white">Trusted Job Sources</h3>
						</div>

						{/* Description */}
						<p className="text-zinc-300 leading-relaxed mb-8 max-w-2xl mx-auto">
							<span className="font-semibold text-white">JobPing</span> aggregates opportunities from Europe's most trusted job platforms and company career pages. We're not affiliated with these companies – we simply connect you with their available listings.
						</p>

						{/* Job Sources Grid */}
						<div className="space-y-6">
							<div className="flex items-center justify-center gap-2 mb-4">
								<div className="h-px bg-gradient-to-r from-transparent via-zinc-600 to-transparent flex-1" />
								<span className="text-sm font-medium text-zinc-400 px-3">Our Sources</span>
								<div className="h-px bg-gradient-to-r from-transparent via-zinc-600 to-transparent flex-1" />
							</div>
							
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
								{jobSources.map((source) => (
									<motion.div
										key={source.name}
										variants={itemVariants}
										whileHover={{ scale: 1.02, y: -2 }}
										className="group relative p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/60 hover:border-zinc-600/70 transition-all duration-300 hover:bg-zinc-800/70"
									>
										{/* Source Icon & Name */}
										<div className="flex flex-col items-center text-center space-y-2">
											<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-700/60 to-zinc-800/60 border border-zinc-600/40 group-hover:border-zinc-500/60 transition-colors group-hover:from-emerald-500/10 group-hover:to-cyan-500/5">
												<div className="text-zinc-300 group-hover:text-emerald-300 transition-colors">
													{source.icon}
												</div>
											</div>
											<div>
												<div className="font-medium text-white text-sm group-hover:text-emerald-300 transition-colors">
													{source.name}
												</div>
												<div className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
													{source.description}
												</div>
											</div>
										</div>

										{/* Category Badge */}
										<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
											<div className={`text-xs px-2 py-1 rounded-full border ${
												source.category === 'job-board' 
													? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
													: source.category === 'aggregator'
													? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
													: 'bg-zinc-500/20 border-zinc-500/30 text-zinc-300'
											}`}>
												{source.category.replace('-', ' ')}
											</div>
										</div>
									</motion.div>
								))}
							</div>
						</div>

						{/* Stats Footer */}
						<motion.div 
							variants={itemVariants}
							className="mt-8 pt-6 border-t border-zinc-700/50"
						>
							<div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-zinc-400">
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 rounded-full bg-emerald-500"></div>
									<span>4,000+ companies scanned daily</span>
								</div>
								<div className="hidden sm:block w-px h-4 bg-zinc-600"></div>
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 rounded-full bg-cyan-500"></div>
									<span>47 EU cities covered</span>
								</div>
								<div className="hidden sm:block w-px h-4 bg-zinc-600"></div>
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 rounded-full bg-zinc-400"></div>
									<span>Updated every 15 minutes</span>
								</div>
							</div>
						</motion.div>
					</div>
				</motion.div>
			</div>
		</motion.div>
	);
}
