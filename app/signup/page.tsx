"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useRef, useState } from "react";
import ErrorBoundary from "../../components/error-boundary";
import { CAREER_PATHS } from "../../components/signup/constants";
import { HeroSection } from "../../components/signup/HeroSection";
import { ProgressBar } from "../../components/signup/ProgressBar";
import { Step1Basics } from "../../components/signup/Step1Basics";
import { Step2Preferences } from "../../components/signup/Step2Preferences";
import { Step3CareerPath } from "../../components/signup/Step3CareerPath";
import { Step4MatchingPreferences } from "../../components/signup/Step4MatchingPreferences";
import { TrustSignals } from "../../components/signup/TrustSignals";
import { useAriaAnnounce } from "../../components/ui/AriaLiveRegion";
import { useReducedMotion } from "../../components/ui/useReducedMotion";
import { useFormPersistence } from "../../hooks/useFormPersistence";
import { Progress } from "../../components/ui/progress";
import {
	useEmailValidation,
	useRequiredValidation,
} from "../../hooks/useFormValidation";
import { ApiError, apiCallJson } from "../../lib/api-client";
import { TIMING } from "../../lib/constants";
import { showToast } from "../../lib/toast";
import { useSignupState } from "../../hooks/useSignupState";
import { useSignupNavigation } from "../../hooks/useSignupNavigation";
import { SignupStats } from "../../components/signup/SignupStats";

function SignupForm() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Initialize step from URL
	const urlStep = searchParams.get("step");
	const initialStep = urlStep
		? Math.max(1, Math.min(4, parseInt(urlStep, 10)))
		: 1;

	// Use our custom hooks for state management
	const signupState = useSignupState(initialStep);
	const {
		step,
		loading,
		activeJobs,
		totalUsers,
		isLoadingStats,
		formData,
		setStep,
		setLoading,
		setError,
		setSuccessState,
		setFormData,
		toggleArrayValue,
	} = signupState;

	const prefersReduced = useReducedMotion();
	const { announce, Announcement } = useAriaAnnounce();
	const formRefs = {
		fullName: useRef<HTMLInputElement>(null),
		email: useRef<HTMLInputElement>(null),
	};

	// Submission progress state
	const [submissionProgress, setSubmissionProgress] = useState(0);
	const [submissionStage, setSubmissionStage] = useState<string>("");

	// Form persistence hook
	const { clearProgress } = useFormPersistence(
		formData as any,
		setFormData as any,
		{ tier: "premium", hasStep: true, minStepForSave: 1 },
		setStep,
		step,
	);

	// Use navigation hook
	useSignupNavigation({
		step,
		formData,
		setStep,
		emailValidation: { isValid: true }, // Will be set below
		announce,
		formRefs,
	});

	// Form validation hooks
	const emailValidation = useEmailValidation(formData.email);
	const nameValidation = useRequiredValidation(formData.fullName, "Full name");
	const citiesValidation = useRequiredValidation(
		formData.cities,
		"Preferred cities",
	);
	const languagesValidation = useRequiredValidation(
		formData.languages,
		"Languages",
	);

	// Update navigation hook with proper email validation
	const navigation = useSignupNavigation({
		step,
		formData,
		setStep,
		emailValidation,
		announce,
		formRefs,
	});

	// Submit handler with progress tracking
	const handleSubmit = useCallback(async () => {
		if (loading) return;

		setLoading(true);
		setError("");
		setSubmissionProgress(0);
		setSubmissionStage("Validating your details...");

		try {
			// Stage 1: Validation (10% - 30%)
			setSubmissionProgress(10);
			await new Promise((resolve) => setTimeout(resolve, 300));
			setSubmissionProgress(30);
			setSubmissionStage("Analyzing your preferences...");

			// Stage 2: API Call (30% - 80%)
			setSubmissionProgress(40);
			const response = await apiCallJson<{
				userId: string;
				email: string;
				matchesCount: number;
			}>("/api/signup", {
				method: "POST",
				body: JSON.stringify(formData),
			});

			if (!response) {
				throw new Error("No response from server");
			}

			setSubmissionProgress(70);
			setSubmissionStage("Finding premium matches...");

			// Stage 3: Success (80% - 100%)
			setSubmissionProgress(90);

			setSuccessState({
				show: true,
				matchesCount: response.matchesCount,
			});

			setSubmissionProgress(100);
			setSubmissionStage("Complete! Sending verification...");

			clearProgress();

			setTimeout(() => {
				router.push(
					`/signup/verify?tier=premium&email=${encodeURIComponent(response.email)}`,
				);
			}, TIMING.REDIRECT_DELAY_MS);
		} catch (error) {
			setSubmissionProgress(0);
			setSubmissionStage("");
			const errorMessage =
				error instanceof ApiError
					? error.message
					: "Unable to connect. Please check your internet connection and try again.";
			setError(errorMessage);
			showToast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	}, [
		loading,
		formData,
		router,
		setLoading,
		setError,
		setSuccessState,
		clearProgress,
	]);

	// Helper functions

	const selectAllRoles = useCallback(
		(careerPath: string) => {
			const career = CAREER_PATHS.find((c) => c.value === careerPath);
			if (career) {
				setFormData({
					...formData,
					roles: career.popularRoles || career.roles,
				});
			}
		},
		[formData, setFormData],
	);

	const clearAllRoles = useCallback(() => {
		setFormData({ ...formData, roles: [] });
	}, [setFormData]);

	return (
		<div className="min-h-screen bg-black relative overflow-hidden pb-[max(1.5rem,env(safe-area-inset-bottom))]">
			{/* Background Effects */}
			<div
				className="absolute inset-0 enhanced-grid opacity-30"
				aria-hidden="true"
			/>
			<motion.div
				className="absolute top-20 right-10 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl hidden sm:block"
				animate={
					prefersReduced
						? { scale: 1, opacity: 0.3 }
						: { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }
				}
				transition={{ duration: 8, repeat: prefersReduced ? 0 : Infinity }}
				aria-hidden="true"
			/>

			{/* Stats fetching component */}
			<SignupStats
				setTotalUsers={(users) => signupState.setTotalUsers(users)}
				setIsLoadingStats={(loading) => signupState.setIsLoadingStats(loading)}
			/>

			{/* Main form content - simplified for now */}
			<div className="relative z-10 flex flex-col min-h-screen">
				{/* Hero Section */}
				<HeroSection
					activeJobs={activeJobs}
					totalUsers={totalUsers}
					isLoadingStats={isLoadingStats}
				/>

				{/* Progress Bar */}
				<ProgressBar step={step} />

				{/* Form Steps Container */}
				<div className="flex-1 flex items-center justify-center p-4">
					<div className="w-full max-w-2xl">
						{/* Submission Progress */}
						{loading && submissionProgress > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className="mb-6 glass-card elevation-1 p-6 text-center"
							>
								<div className="mb-4">
									<Progress value={submissionProgress} className="h-2" />
								</div>
								<p className="text-white font-medium text-lg">
									{submissionStage}
								</p>
								<p className="text-zinc-400 text-sm mt-1">
									Creating your premium account...
								</p>
							</motion.div>
						)}

						{/* Step content will be added here */}
						<div className="text-white text-center">
							{step === 1 && (
								<Step1Basics
									key="step1"
									formData={formData}
									setFormData={setFormData as any}
									touchedFields={new Set()}
									setTouchedFields={() => {}}
									fieldErrors={{}}
									setFieldErrors={() => {}}
									announce={announce}
									loading={loading}
									setStep={navigation.navigateToStep}
									emailValidation={emailValidation}
									nameValidation={nameValidation}
									citiesValidation={citiesValidation}
									languagesValidation={languagesValidation}
									shouldShowError={() => false}
									getDisabledMessage={() => "Continue"}
									toggleArray={toggleArrayValue as any}
								/>
							)}{" "}
							{step === 2 && (
								<Step2Preferences
									key="step2"
									formData={formData}
									setFormData={setFormData as any}
									touchedFields={new Set()}
									setTouchedFields={() => {}}
									loading={loading}
									setStep={navigation.navigateToStep}
									shouldShowError={() => false}
									getDisabledMessage={() => "Continue"}
									toggleArray={toggleArrayValue as any}
								/>
							)}{" "}
							{step === 3 && (
								<Step3CareerPath
									key="step3"
									formData={formData}
									setFormData={setFormData as any}
									touchedFields={new Set()}
									setTouchedFields={() => {}}
									loading={loading}
									setStep={navigation.navigateToStep}
									shouldShowError={() => false}
									getDisabledMessage={() => "Continue"}
									toggleArray={toggleArrayValue as any}
									selectAllRoles={selectAllRoles}
									clearAllRoles={clearAllRoles}
									tier="premium"
								/>
							)}{" "}
							{step === 4 && (
								<Step4MatchingPreferences
									key="step4"
									formData={formData}
									setFormData={setFormData as any}
									loading={loading}
									setStep={navigation.navigateToStep}
									handleSubmit={handleSubmit}
								/>
							)}
						</div>
					</div>
				</div>

				{/* Trust Signals */}
				<TrustSignals activeJobs={activeJobs} isLoadingStats={isLoadingStats} />
			</div>

			{/* Announcement for screen readers */}
			{Announcement}
		</div>
	);
}

// Wrap in Suspense to handle useSearchParams
export default function SignupPage() {
	return (
		<ErrorBoundary>
			<Suspense
				fallback={
					<div className="min-h-screen bg-black flex items-center justify-center">
						<div className="text-white text-xl">Loading...</div>
					</div>
				}
			>
				<SignupForm />
			</Suspense>
		</ErrorBoundary>
	);
}
