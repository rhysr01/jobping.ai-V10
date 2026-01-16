"use client";

import { motion } from "framer-motion";
import React from "react";
import { SharedFormField } from "../ui/SharedFormField";
import { MobileNavigation } from "./MobileNavigation";
import { showToast } from "../../lib/toast";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { SignupFormData } from "./types";

interface Step1FreeBasicsProps {
	formData: SignupFormData;
	setFormData: React.Dispatch<React.SetStateAction<SignupFormData>>;
	touchedFields: Set<string>;
	setTouchedFields: React.Dispatch<React.SetStateAction<Set<string>>>;
	fieldErrors: Record<string, string>;
	setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
	announce: (message: string, politeness?: "polite" | "assertive") => void;
	loading: boolean;
	setStep: (step: number) => void;
	emailValidation: { isValid: boolean; error?: string };
	nameValidation: { isValid: boolean; error?: string };
	shouldShowError: (
		fieldName: string,
		hasValue: boolean,
		isValid: boolean,
	) => boolean;
	getDisabledMessage: (stepNumber: number) => string;
}

export const Step1FreeBasics = React.memo(function Step1FreeBasics({
	formData,
	setFormData,
	touchedFields: _touchedFields,
	setTouchedFields,
	fieldErrors,
	setFieldErrors,
	announce,
	loading,
	setStep,
	emailValidation,
	nameValidation,
	shouldShowError,
	getDisabledMessage,
}: Step1FreeBasicsProps) {

	const handleNameChange = (value: string) => {
		setFormData({ ...formData, fullName: value });
		setFieldErrors((prev) => {
			const next = { ...prev };
			delete next.fullName;
			return next;
		});
	};

	const handleEmailChange = (value: string) => {
		setFormData({ ...formData, email: value });
		setFieldErrors((prev) => {
			const next = { ...prev };
			delete next.email;
			return next;
		});
	};

	const handleNameBlur = () => {
		setTouchedFields((prev) => new Set(prev).add("fullName"));
		if (!formData.fullName.trim() && formData.fullName.length > 0) {
			announce("Full name is required", "assertive");
		} else if (formData.fullName.trim().length > 0) {
			announce("Full name is valid", "polite");
		}
	};

	// Keyboard navigation enhancement
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !loading && isStepValid) {
			e.preventDefault();
			setStep(2);
		}
	};

	const handleEmailBlur = () => {
		setTouchedFields((prev) => new Set(prev).add("email"));
		if (emailValidation.error || fieldErrors.email) {
			announce(
				fieldErrors.email || emailValidation.error || "",
				"assertive",
			);
		} else if (emailValidation.isValid) {
			announce("Email address is valid", "polite");
			showToast.success("Email verified! ✓");
		}
	};


	const isStepValid = formData.fullName.trim() && formData.email.trim() && emailValidation.isValid;

	return (
		<motion.div
			key="step1"
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.4 }}
			className="space-y-6 sm:space-y-8 md:space-y-10"
			role="region"
			aria-labelledby="step1-heading"
			onKeyDown={handleKeyDown}
		>
			<div className="mb-6 sm:mb-8">
				<h2 id="step1-heading" className="text-display-md font-black text-white mb-2 sm:mb-3 bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-transparent">
					Let's get started
				</h2>
				<p className="text-base sm:text-lg font-medium text-zinc-100 leading-relaxed">
					Tell us about yourself to find your perfect matches
				</p>
			</div>

			<div className="space-y-6">
				<SharedFormField
					id="fullName"
					label="Full Name"
					required
					type="text"
					value={formData.fullName}
					onChange={handleNameChange}
					onBlur={handleNameBlur}
					placeholder="John Smith"
					error={fieldErrors.fullName || (shouldShowError("fullName", formData.fullName.length > 0, nameValidation.isValid) ? nameValidation.error : undefined)}
					success={formData.fullName.length > 0 && nameValidation.isValid ? "Looks good!" : undefined}
					autoComplete="name"
					inputMode="text"
				/>

				<HoverCard>
					<HoverCardTrigger asChild>
						<div>
							<SharedFormField
								id="email"
								label="Email"
								required
								type="email"
								value={formData.email}
								onChange={handleEmailChange}
								onBlur={handleEmailBlur}
								placeholder="you@example.com"
								helpText="Get 5 instant matches - no spam, no commitment"
								error={fieldErrors.email || (shouldShowError("email", formData.email.length > 0, emailValidation.isValid) ? emailValidation.error : undefined)}
								success={formData.email.length > 0 && emailValidation.isValid ? "Email looks good!" : undefined}
								autoComplete="email"
								inputMode="email"
							/>
						</div>
					</HoverCardTrigger>
					<HoverCardContent className="w-80 p-4" side="right">
						<div className="space-y-2">
							<p className="text-sm font-semibold text-white">📧 Your privacy matters</p>
							<p className="text-xs text-zinc-300 leading-relaxed">
								We'll only send you personalized job matches - never spam or share your email.
								You can unsubscribe anytime with one click.
							</p>
						</div>
					</HoverCardContent>
				</HoverCard>
			</div>

			{/* Spacer for sticky navigation */}
			<div className="h-32" />

			{/* Mobile Navigation */}
			<MobileNavigation
				currentStep={1}
				totalSteps={3}
				onNext={() => setStep(2)}
				nextDisabled={!isStepValid || loading}
				nextLabel={getDisabledMessage(1)}
				loading={loading}
			/>
		</motion.div>
	);
});