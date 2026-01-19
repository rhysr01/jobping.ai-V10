"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface LiveMatchingMessagesProps {
	estimatedJobCount?: number;
}

const DEFAULT_JOB_COUNT = 4200;

export function LiveMatchingMessages({
	estimatedJobCount = DEFAULT_JOB_COUNT,
}: LiveMatchingMessagesProps) {
	const formattedJobCount =
		estimatedJobCount >= 1000
			? `${Math.floor(estimatedJobCount / 1000)},${(estimatedJobCount % 1000).toString().padStart(3, "0")}+`
			: `${estimatedJobCount}+`;

	const SCANNING_MESSAGES = [
		`Scanning ${formattedJobCount} active jobs...`,
		"Filtering by your cities...",
		"Matching career paths...",
		"Checking visa requirements...",
		"Calculating match scores...",
		"Finding your top 5 matches...",
	];
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % SCANNING_MESSAGES.length);
		}, 1500);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="h-12 flex items-center justify-center">
			<AnimatePresence mode="wait">
				<motion.p
					key={currentIndex}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					transition={{ duration: 0.3 }}
					className="text-lg text-content-secondary"
				>
					{SCANNING_MESSAGES[currentIndex]}
				</motion.p>
			</AnimatePresence>
		</div>
	);
}
