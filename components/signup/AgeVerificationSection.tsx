"use client";

import { useState } from "react";

interface AgeVerificationSectionProps {
	birthYear?: number;
	ageVerified: boolean;
	termsAccepted: boolean;
	onBirthYearChange: (year: number) => void;
	onAgeVerifiedChange: (verified: boolean) => void;
	onTermsAcceptedChange: (accepted: boolean) => void;
	disabled?: boolean;
	showErrors?: boolean;
}

const currentYear = new Date().getFullYear();
const minBirthYear = 1900;
const maxBirthYear = currentYear - 16; // Must be at least 16 years old

export function AgeVerificationSection({
	birthYear,
	ageVerified,
	termsAccepted,
	onBirthYearChange,
	onAgeVerifiedChange,
	onTermsAcceptedChange,
	disabled = false,
	showErrors = false,
}: AgeVerificationSectionProps) {
	const [birthYearInput, setBirthYearInput] = useState(birthYear?.toString() || "");

	const handleBirthYearChange = (value: string) => {
		setBirthYearInput(value);
		const year = parseInt(value);
		if (!isNaN(year) && year >= minBirthYear && year <= maxBirthYear) {
			onBirthYearChange(year);
		}
	};

	const isValidBirthYear = birthYear && birthYear >= minBirthYear && birthYear <= maxBirthYear;
	const birthYearError = showErrors && !isValidBirthYear && birthYearInput !== ""
		? "Please enter a valid birth year (you must be at least 16 years old)"
		: undefined;

	const ageVerificationError = showErrors && !ageVerified
		? "Please confirm you are at least 16 years old"
		: undefined;

	const termsError = showErrors && !termsAccepted
		? "Please accept the terms of service to continue"
		: undefined;

	return (
		<div className="space-y-6">
			{/* Age Verification */}
			<div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
				<h3 className="text-lg font-semibold text-white mb-4">
					Age Verification (Required)
				</h3>

				<div className="space-y-4">
					{/* Birth Year Input */}
					<div>
						<label
							htmlFor="birth-year"
							className="block text-sm font-medium text-white mb-2"
						>
							Year of Birth
						</label>
						<input
							type="number"
							id="birth-year"
							min={minBirthYear}
							max={maxBirthYear}
							value={birthYearInput}
							onChange={(e) => handleBirthYearChange(e.target.value)}
							placeholder={`e.g., ${maxBirthYear - 20}`}
							disabled={disabled}
							className={`w-full px-4 py-3 rounded-lg border-2 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors ${
								birthYearError
									? "border-red-500 focus:border-red-500"
									: isValidBirthYear
									? "border-green-500"
									: "border-zinc-700 focus:border-brand-500"
							}`}
							aria-describedby={birthYearError ? "birth-year-error" : undefined}
							aria-invalid={!!birthYearError}
						/>
						{birthYearError && (
							<p id="birth-year-error" className="mt-2 text-sm text-red-400 flex items-center gap-2 font-medium" role="alert">
								<span className="text-red-400">⚠️</span>
								{birthYearError}
							</p>
						)}
						<p className="mt-2 text-xs text-zinc-400">
							You must be at least 16 years old to use JobPing (GDPR requirement).
						</p>
					</div>

					{/* Age Confirmation Checkbox */}
					<div className="flex items-start gap-3">
						<input
							type="checkbox"
							id="age-verification"
							checked={ageVerified}
							onChange={(e) => onAgeVerifiedChange(e.target.checked)}
							disabled={disabled}
							className="mt-1 w-4 h-4 text-brand-600 bg-zinc-900 border-zinc-700 rounded focus:ring-brand-500 focus:ring-2"
							aria-describedby={ageVerificationError ? "age-verification-error" : "age-verification-help"}
							aria-invalid={!!ageVerificationError}
						/>
						<div className="flex-1">
							<label
								htmlFor="age-verification"
								className="text-sm font-medium text-white cursor-pointer"
							>
								I confirm I am at least 16 years old
							</label>
							{ageVerificationError && (
								<p id="age-verification-error" className="mt-2 text-sm text-red-400 flex items-center gap-2 font-medium" role="alert">
									<span className="text-red-400">⚠️</span>
									{ageVerificationError}
								</p>
							)}
							<p id="age-verification-help" className="mt-2 text-xs text-zinc-400">
								This confirmation is required by EU data protection laws (GDPR).
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Terms of Service Acceptance */}
			<div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
				<h3 className="text-lg font-semibold text-white mb-4">
					Terms of Service (Required)
				</h3>

				<div className="space-y-4">
					{/* Terms Acceptance Checkbox */}
					<div className="flex items-start gap-3">
						<input
							type="checkbox"
							id="terms-acceptance"
							checked={termsAccepted}
							onChange={(e) => onTermsAcceptedChange(e.target.checked)}
							disabled={disabled}
							className="mt-1 w-4 h-4 text-brand-600 bg-zinc-900 border-zinc-700 rounded focus:ring-brand-500 focus:ring-2"
							aria-describedby={termsError ? "terms-error" : "terms-help"}
							aria-invalid={!!termsError}
						/>
						<div className="flex-1">
							<label
								htmlFor="terms-acceptance"
								className="text-sm font-medium text-white cursor-pointer"
							>
								I accept the{" "}
								<a
									href="/legal/terms"
									target="_blank"
									rel="noopener noreferrer"
									className="text-brand-400 hover:text-brand-300 underline decoration-brand-400/30 underline-offset-4 hover:decoration-brand-300/50 transition-colors"
								>
									Terms of Service
								</a>{" "}
								and{" "}
								<a
									href="/legal/privacy"
									target="_blank"
									rel="noopener noreferrer"
									className="text-brand-400 hover:text-brand-300 underline decoration-brand-400/30 underline-offset-4 hover:decoration-brand-300/50 transition-colors"
								>
									Privacy Policy
								</a>
							</label>
							{termsError && (
								<p id="terms-error" className="mt-2 text-sm text-red-400 flex items-center gap-2 font-medium" role="alert">
									<span className="text-red-400">⚠️</span>
									{termsError}
								</p>
							)}
							<p id="terms-help" className="mt-2 text-xs text-zinc-400">
								By accepting, you agree to our terms and acknowledge our privacy practices.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}