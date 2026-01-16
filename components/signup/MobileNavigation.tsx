"use client";

import { motion } from "framer-motion";
import React from "react";
import CustomButton from "../ui/CustomButton";

interface MobileNavigationProps {
	currentStep: number;
	totalSteps: number;
	onNext?: () => void;
	onBack?: () => void;
	nextDisabled?: boolean;
	backDisabled?: boolean;
	nextLabel?: string;
	backLabel?: string;
	loading?: boolean;
}

export const MobileNavigation = React.memo(function MobileNavigation({
	currentStep,
	totalSteps,
	onNext,
	onBack,
	nextDisabled = false,
	backDisabled = false,
	nextLabel = "Continue",
	backLabel = "Back",
	loading = false,
}: MobileNavigationProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="sticky bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8"
		>
			{/* Step Indicator */}
			<div className="flex items-center justify-center mb-4">
				<div className="flex items-center gap-2">
					{Array.from({ length: totalSteps }).map((_, index) => (
						<div
							key={index}
							className={`h-2 w-8 rounded-full transition-colors ${
								index + 1 <= currentStep
									? "bg-brand-500"
									: "bg-zinc-600"
							}`}
						/>
					))}
				</div>
			</div>

			{/* Navigation Buttons */}
			<div className="flex gap-3 sm:gap-4">
				{currentStep > 1 && (
					<CustomButton
						onClick={onBack}
						disabled={backDisabled}
						variant="secondary"
						size="md"
						fullWidth
						className="flex-1"
					>
						{backLabel}
					</CustomButton>
				)}

				<CustomButton
					onClick={onNext}
					disabled={nextDisabled || loading}
					variant="primary"
					size="md"
					fullWidth
					isLoading={loading}
					className="flex-1"
				>
					{nextLabel}
				</CustomButton>
			</div>
		</motion.div>
	);
});