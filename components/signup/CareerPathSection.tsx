"use client";

import { motion } from "framer-motion";
import { CAREER_PATHS } from "./constants";

interface CareerPathSectionProps {
	careerPath: string;
	onChange: (value: string) => void;
	isSubmitting: boolean;
}

export function CareerPathSection({
	careerPath,
	onChange,
	isSubmitting,
}: CareerPathSectionProps) {
	return (
		<div>
			<label className="block text-base font-bold text-white mb-3">
				What's your career interest? *
			</label>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				{CAREER_PATHS.map((path) => (
					<motion.button
						key={path.value}
						type="button"
						onClick={() => onChange(path.value)}
						whileTap={{ scale: 0.97 }}
						disabled={isSubmitting}
						className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
							careerPath === path.value
								? "border-brand-500 bg-brand-500/10"
								: "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
						} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
					>
						<span className="font-medium text-white text-sm">{path.label}</span>
					</motion.button>
				))}
			</div>
		</div>
	);
}
