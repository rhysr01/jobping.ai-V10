import { motion } from "framer-motion";
import { LiveMatchingMessages } from "./LiveMatchingMessages";

interface LiveMatchingOverlayProps {
	showLiveMatching: boolean;
	isSubmitting: boolean;
	matchCount: number;
	estimatedJobCount?: number;
}

export function LiveMatchingOverlay({ showLiveMatching, isSubmitting, matchCount, estimatedJobCount }: LiveMatchingOverlayProps) {
	if (!showLiveMatching && !isSubmitting) return null;

	return (
		<motion.div
			key="live-matching"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0, transition: { duration: 0.3 } }}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
			role="dialog"
			aria-modal="true"
			aria-labelledby="matching-status"
			aria-live="polite"
		>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				className="text-center max-w-md px-4"
			>
				{/* Animated scanning lines */}
				<motion.div
					className="relative w-full h-2 bg-zinc-800 rounded-full mb-8 overflow-hidden"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
				>
					<motion.div
						className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500 to-transparent"
						animate={{
							x: ["-100%", "200%"],
						}}
						transition={{
							duration: 2,
							repeat: Infinity,
							ease: "linear",
						}}
					/>
				</motion.div>

				{/* Dynamic scanning messages */}
				<LiveMatchingMessages estimatedJobCount={estimatedJobCount} />

				{/* Job count ticker */}
				<motion.div
					id="matching-status"
					className="mt-8 text-4xl font-bold text-brand-400"
					key={matchCount}
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					aria-live="polite"
					aria-atomic="true"
				>
					{matchCount > 0
						? `${matchCount} ${matchCount === 1 ? 'match' : 'matches'} found`
						: isSubmitting
							? "Scanning..."
							: "Processing..."
					}
				</motion.div>
			</motion.div>
		</motion.div>
	);
}