"use client";

import { motion } from "framer-motion";
import React, { useState, useRef } from "react";
import { CityChip } from "../ui/CityChip";
import { FormFieldError, FormFieldSuccess } from "../ui/FormFieldFeedback";
import CustomButton from "../ui/CustomButton";
import { MobileNavigation } from "./MobileNavigation";
import { UI } from "../../lib/constants";
import { showToast } from "../../lib/toast";
import { POPULAR_CITIES, ALL_CITIES } from "./constants";
import type { SignupFormData } from "./types";

interface Step2FreeCitiesProps {
	formData: SignupFormData;
	setFormData: React.Dispatch<React.SetStateAction<SignupFormData>>;
	loading: boolean;
	setStep: (step: number) => void;
}

export const Step2FreeCities = React.memo(function Step2FreeCities({
	formData,
	setFormData,
	loading,
	setStep,
}: Step2FreeCitiesProps) {
	const formRefs = {
		cities: useRef<HTMLDivElement>(null),
	};

	const [showAllCities, setShowAllCities] = useState(false);

	const displayedCities = showAllCities ? ALL_CITIES : POPULAR_CITIES || [];

	const handleCityToggle = (city: string) => {
		if (!city || typeof city !== "string") return;

		if ("vibrate" in navigator) {
			navigator.vibrate(10);
		}

		const isDisabled =
			!formData.cities.includes(city) && formData.cities.length >= 3;
		if (isDisabled) {
			showToast.error(
				"Maximum 3 cities selected. Deselect one to choose another.",
			);
			return;
		}

		const wasSelected = formData.cities.includes(city);
		const newCities = wasSelected
			? formData.cities.filter((c: string) => c !== city)
			: [...formData.cities, city];

		setFormData((prev) => ({ ...prev, cities: newCities }));

		// Show success feedback
		if (!wasSelected) {
			showToast.success(`Added ${city} to your preferences`);
		} else {
			showToast.info(`Removed ${city}`);
		}
	};

	const isStepValid = formData.cities.length > 0;

	return (
		<motion.div
			key="step2"
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.4 }}
			className="space-y-6 sm:space-y-8 md:space-y-10"
			role="region"
			aria-labelledby="step2-heading"
		>
			<div className="mb-6 sm:mb-8">
				<h2
					id="step2-heading"
					className="text-display-md font-black text-white mb-2 sm:mb-3 bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-transparent"
				>
					Jobs in Your Preferred Cities
				</h2>
				<p className="text-base sm:text-lg font-medium text-zinc-100 leading-relaxed">
					Choose where you want to work - we'll find roles with visa support if
					needed
				</p>
				<div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
					<span className="text-sm font-medium text-blue-200">
						📍 Pick up to 3 cities • Includes relocation opportunities
					</span>
				</div>
			</div>

			<div>
				<label
					id="cities-label"
					className="block text-base font-bold text-white mb-3 flex items-center gap-2"
				>
					<span>Preferred Cities</span>
					<span className="text-error text-sm" aria-label="required">
						*
					</span>
				</label>
				<p
					id="cities-help"
					className="text-sm text-zinc-400 mb-4 leading-relaxed"
				>
					Choose cities where you'd like to work. We'll find the best matches
					instantly.
				</p>

				{/* Mobile-Optimized City Selection - No Map Dependency */}
				<div
					ref={formRefs.cities}
					className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
					role="group"
					aria-labelledby="cities-label"
					aria-describedby="cities-help"
				>
					{displayedCities?.map((city) => {
						if (!city || typeof city !== "string") return null;
						const isSelected = formData.cities.includes(city);
						const isDisabled = !isSelected && formData.cities.length >= 3;
						return (
							<CityChip
								key={city}
								city={city}
								isSelected={isSelected}
								isDisabled={isDisabled}
								onToggle={() => handleCityToggle(city)}
								onRemove={(city) => {
									setFormData({
										...formData,
										cities: formData.cities.filter((c: string) => c !== city),
									});
								}}
								className="min-h-[48px] touch-manipulation" // Mobile-friendly sizing
							/>
						);
					})}
				</div>

				{/* Show More Button - Only show if not showing all cities */}
				{!showAllCities && POPULAR_CITIES.length > 0 && (
					<div className="mt-4 text-center">
						<CustomButton
							onClick={() => {
								console.log("Step2FreeCities: Show more cities clicked");
								setShowAllCities(true);
							}}
							variant="ghost"
							size="sm"
							className="text-sm text-brand-400 hover:text-brand-300 underline underline-offset-2"
							type="button"
						>
							Show {ALL_CITIES.length - POPULAR_CITIES.length} more cities →
						</CustomButton>
					</div>
				)}

				{/* Selection Summary */}
				<div className="mt-4 flex items-center justify-between">
					<p className="text-sm text-zinc-400">
						{formData.cities.length}/3 selected
					</p>
					{formData.cities.length > 0 && (
						<FormFieldSuccess
							message={`${formData.cities.length} ${formData.cities.length === 1 ? "city" : "cities"} selected`}
							id="cities-success"
						/>
					)}
				</div>

				{/* Selected Cities Display */}
				{formData.cities.length > 0 && (
					<div className="mt-2 p-3 bg-white/5 rounded-lg">
						<p className="text-sm text-zinc-300 mb-1">Selected:</p>
						<p className="text-sm font-medium text-white">
							{formData.cities.join(", ")}
						</p>
					</div>
				)}

			</div>

			{/* Spacer for sticky navigation */}
			<div className={UI.SPACING.STICKY_NAV_SPACER} />

			{/* Mobile Navigation */}
			<MobileNavigation
				currentStep={2}
				totalSteps={3}
				onNext={() => {
					if (isStepValid) {
						setStep(3);
					}
				}}
				onBack={() => setStep(1)}
				nextDisabled={!isStepValid || loading}
				nextLabel="Continue"
				loading={loading}
			/>
		</motion.div>
	);
});
