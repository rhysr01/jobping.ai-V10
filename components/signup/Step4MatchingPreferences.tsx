"use client";

import { motion } from "framer-motion";
import React from "react";
import { AgeVerificationSection } from "./AgeVerificationSection";
import type { SignupFormData } from "./types";

interface Step4MatchingPreferencesProps {
	formData: SignupFormData;
	setFormData: React.Dispatch<React.SetStateAction<SignupFormData>>;
	loading: boolean;
	setStep: (step: number) => void;
	handleSubmit: () => void;
}

export const Step4MatchingPreferences = React.memo(
	function Step4MatchingPreferences({
		formData,
		setFormData,
		loading,
		setStep,
		handleSubmit,
	}: Step4MatchingPreferencesProps) {
		return (
			<motion.div
				key="step4"
				initial={{ opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0 }}
				exit={{ opacity: 0, x: -20 }}
				transition={{ duration: 0.4 }}
				className="relative"
			>
				<div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 via-[#0f172a]/45 to-brand-700/15 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
					<div
						className="pointer-events-none absolute -top-28 right-8 h-52 w-52 rounded-full bg-brand-500/25 blur-[120px] hidden sm:block"
						aria-hidden="true"
					/>
					<div
						className="pointer-events-none absolute -bottom-24 left-6 h-48 w-48 rounded-full bg-brand-700/20 blur-3xl hidden sm:block"
						aria-hidden="true"
					/>
					<div
						className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(136,84,255,0.12),transparent_60%)]"
						aria-hidden="true"
					/>
					<div className="relative z-10 space-y-6 sm:space-y-8 md:space-y-10">
						<div className="text-center mb-6 sm:mb-8">
							<h2 className="text-2xl sm:text-3xl font-black text-white mb-2 bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-transparent">
								Ready to start matching!
							</h2>
							<p className="text-sm sm:text-base text-zinc-200 mb-4 leading-relaxed">
								We have everything we need to find your perfect matches
							</p>
						</div>

						{/* Age Verification and Terms - Required before submission */}
						<AgeVerificationSection
							ageVerified={true}
							termsAccepted={true}
							gdprConsent={true}
							onAgeVerifiedChange={(_verified) => () => {}}
							onTermsAcceptedChange={(_accepted) => () => {}}
							onGdprConsentChange={(_consent) => () => {}}
							disabled={loading}
							showErrors={!true || !true || !true}
						/>

						{/* GDPR Consent - Required before submission */}
						<div className="bg-gradient-to-r from-brand-500/15 via-brand-700/15 to-brand-500/15 border-2 border-brand-500/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-7 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
							<label className="flex items-start gap-3 sm:gap-4 cursor-pointer group touch-manipulation">
								<input
									type="checkbox"
									id="gdpr-consent-step4"
									checked={formData.gdprConsent}
									onChange={(e) => {
										setFormData({
											...formData,
											gdprConsent: e.target.checked,
										});
									}}
									className="mt-1 w-6 h-6 sm:w-5 sm:h-5 rounded border-2 border-zinc-600 bg-zinc-800 checked:bg-brand-500 checked:border-brand-500 cursor-pointer touch-manipulation min-w-[48px] min-h-[48px] sm:min-w-0 sm:min-h-0"
									required
									aria-required="true"
									aria-describedby="gdpr-error-step4"
								/>
								<div className="flex-1">
									<p className="text-white font-medium mb-1">
										I agree to receive job recommendations via email *
									</p>
									<p className="text-sm text-zinc-400">
										By checking this box, you consent to receive personalized
										job matches and agree to our{" "}
										<a
											href="/legal/privacy"
											target="_blank"
											rel="noopener noreferrer"
											className="text-brand-400 hover:text-brand-300 underline font-semibold"
										>
											Privacy Policy
										</a>{" "}
										and{" "}
										<a
											href="/legal/terms"
											target="_blank"
											rel="noopener noreferrer"
											className="text-brand-400 hover:text-brand-300 underline font-semibold"
										>
											Terms of Service
										</a>
										. You can unsubscribe at any time.
									</p>
									{!formData.gdprConsent && (
										<p
											id="gdpr-error-step4"
											className="mt-2 text-sm text-error flex items-center gap-2 font-medium"
											role="alert"
											aria-live="polite"
										>
											<span>⚠️</span>
											<span>
												You must agree to receive job matches to continue
											</span>
										</p>
									)}
								</div>
							</label>
						</div>

						{/* Spacer for sticky button */}
						<div className="h-32 sm:h-0" aria-hidden="true" />

						{/* Sticky Submit Button */}
						<div className="sticky bottom-0 left-0 right-0 z-40 md:z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8">
							<div className="flex gap-3 sm:gap-4">
								<motion.button
									onClick={() => setStep(3)}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									className="btn-secondary flex-1 py-4 sm:py-5 text-base sm:text-lg touch-manipulation min-h-[56px]"
								>
									← Back
								</motion.button>
								<motion.button
									onClick={handleSubmit}
									disabled={loading || !true || !true || !formData.gdprConsent}
									whileHover={{
										scale:
											loading || !true || !true || !formData.gdprConsent
												? 1
												: 1.03,
									}}
									whileTap={{
										scale:
											loading || !true || !true || !formData.gdprConsent
												? 1
												: 0.97,
									}}
									className="relative flex-1 py-4 sm:py-6 md:py-7 text-base sm:text-xl md:text-2xl font-black disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 uppercase tracking-wide rounded-xl sm:rounded-2xl overflow-hidden touch-manipulation min-h-[56px]"
									style={{
										background: loading
											? "linear-gradient(to right, #14B8A6, #0D9488, #0F766E)"
											: "linear-gradient(135deg, #14B8A6 0%, #0D9488 50%, #0F766E 100%)",
										boxShadow:
											"0 0 60px rgba(20,184,166,0.8), 0 20px 60px -18px rgba(20,184,166,0.9), inset 0 1px 0 rgba(255,255,255,0.3)",
										textShadow: "0 2px 8px rgba(0,0,0,0.4)",
										transition: "all 0.3s ease",
									}}
								>
									{loading ? (
										<>
											<svg
												className="w-6 h-6 animate-spin"
												viewBox="0 0 24 24"
												fill="none"
											>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												></circle>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												></path>
											</svg>
											<span>Finding Matches...</span>
										</>
									) : (
										<>
											<span>Complete Signup · €5/mo →</span>
										</>
									)}
								</motion.button>
							</div>
						</div>
					</div>
				</div>
			</motion.div>
		);
	},
);
