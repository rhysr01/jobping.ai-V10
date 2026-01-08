"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Footer() {
	const links = [
		{ label: "About", href: "/about" },
		{ label: "Pricing", href: "/pricing" },
		{ label: "Privacy Policy", href: "/legal/privacy" },
		{ label: "Terms", href: "/legal/terms" },
		{ label: "Contact", href: "/contact" },
	];

	return (
		<footer className="relative mt-32 section-padding pb-[max(2rem,env(safe-area-inset-bottom))] border-t border-white/5 bg-black/40">
			{/* Gradient fade at top */}
			<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
			<div className="container-page">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12"
				>
					{/* Left: Logo + Tagline */}
					<div className="flex flex-col gap-3">
						<div className="scale-60 md:scale-80 origin-left">
							<h3 className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent mb-2">
								JobPing
							</h3>
						</div>
						<p className="text-xs text-content-muted max-w-md leading-relaxed">
							AI-powered job matching for early-career roles across Europe. Get
							personalized matches delivered to your inbox.
						</p>
					</div>

					{/* Right: System Status */}
					<div className="flex flex-col items-start md:items-end gap-4">
						<Link
							href="https://status.getjobping.com"
							target="_blank"
							rel="noopener noreferrer"
							className="group inline-flex items-center gap-2 text-xs text-content-muted hover:text-emerald-400 transition-colors"
						>
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
								<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
							</span>
							<span>All Systems Operational</span>
						</Link>

						<nav className="flex flex-wrap items-center gap-3 md:justify-end">
							{links.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className="text-xs text-content-muted hover:text-emerald-400 transition-colors inline-flex items-center gap-1 group"
								>
									{link.label}
								</Link>
							))}
							<a
								href="mailto:support@jobping.com"
								className="text-xs text-content-muted hover:text-emerald-400 transition-colors"
							>
								Support
							</a>
						</nav>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="mt-8 pt-8 border-t border-white/5 text-center"
				>
					<p className="text-xs text-content-muted">
						© {new Date().getFullYear()} JobPing. All rights reserved.
					</p>
				</motion.div>
			</div>
		</footer>
	);
}
