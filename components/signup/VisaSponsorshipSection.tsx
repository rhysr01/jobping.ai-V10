"use client";

import { motion } from "framer-motion";

interface VisaSponsorshipSectionProps {
	visaSponsorship: "yes" | "no" | "";
	onChange: (value: "yes" | "no") => void;
	isSubmitting: boolean;
}

export function VisaSponsorshipSection({
	visaSponsorship,
	onChange,
	isSubmitting,
}: VisaSponsorshipSectionProps) {
	return (
		<div className="mb-8">
			<label className="block text-lg font-bold text-white mb-3">
				Do you require visa sponsorship to work in the EU? *
			</label>
			<p className="text-sm text-content-secondary mb-4">
				90% of graduate applications from international students are
				rejected due to visa issues. We filter jobs accordingly.
			</p>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<motion.button
					type="button"
					onClick={() => onChange("yes")}
					whileTap={{ scale: 0.97 }}
					disabled={isSubmitting}
					className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
						visaSponsorship === "yes"
							? "border-emerald-500 bg-emerald-500/10"
							: "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
					} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
				>
					{visaSponsorship === "yes" && (
						<div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/20 to-transparent pointer-events-none" />
					)}
					<div className="relative flex flex-col">
						<div className="flex items-center gap-2 mb-4">
							<span className="text-xl">✅</span>
							<span className="font-bold text-white">
								Yes, I need a visa
							</span>
						</div>
						<p className="text-sm text-content-secondary text-left">
							We'll prioritize roles with visa sponsorship
						</p>
					</div>
				</motion.button>

				<motion.button
					type="button"
					onClick={() => onChange("no")}
					whileTap={{ scale: 0.97 }}
					disabled={isSubmitting}
					className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
						visaSponsorship === "no"
							? "border-brand-500 bg-brand-500/10"
							: "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
					} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
				>
					{visaSponsorship === "no" && (
						<div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-400/20 to-transparent pointer-events-none" />
					)}
					<div className="relative flex flex-col">
						<div className="flex items-center gap-2 mb-4">
							<span className="text-xl">🇪🇺</span>
							<span className="font-bold text-white">
								No, I have EU citizenship
							</span>
						</div>
						<p className="text-sm text-content-secondary text-left">
							We'll show all available graduate roles
						</p>
					</div>
				</motion.button>
			</div>
		</div>
	);
}