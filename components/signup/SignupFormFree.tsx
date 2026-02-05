"use client";

import * as Sentry from "@sentry/nextjs";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import type { FormDataType } from "@/hooks/useFormPersistence";
import { useEmailValidation } from "@/hooks/useFormValidation";
import { useFreeSignupNavigation } from "@/hooks/useFreeSignupNavigation";
import { useSignupState } from "@/hooks/useSignupState";
import { ApiError, apiCallJson } from "@/lib/api-client";
import { TIMING } from "@/lib/constants";
import { debugLogger } from "@/lib/debug-logger";
import { showToast } from "@/lib/toast";
import ErrorBoundary from "../../components/error-boundary";
import { useAriaAnnounce } from "../ui/AriaLiveRegion";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { PageLoading } from "../ui/skeletons";
import { HeroSectionFree } from "./HeroSectionFree";
import { Step1FreeBasics } from "./Step1FreeBasics";
import { Step2FreeCities } from "./Step2FreeCities";
import { Step3FreeCareer } from "./Step3FreeCareer";
import { LiveJobsReview } from "./LiveJobsReview";
import { TrustSignals } from "./TrustSignals";

function SignupFormFree() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Initialize step from URL
	const urlStep = searchParams.get("step");
	const initialStep = urlStep
		? Math.max(1, Math.min(3, parseInt(urlStep, 10)))
		: 1;

	// Log initialization
	debugLogger.step("INIT", "SignupFormFree component mounting", {
		initialStep,
		urlStep,
	});

	// Use our custom hooks for state management
	const signupState = useSignupState(initialStep);
	const {
		step,
		loading,
		activeJobs,
		totalUsers,
		isLoadingStats,
		formData,
		error: signupError, // Extract error to monitor it
		setStep,
		setLoading,
		setError,
		setSuccessState,
		setFormData,
		updateFormData,
	} = signupState;

	// Guard against undefined functions during SSR or initialization
	// This prevents "setFormData is not defined" and "updateFormData is not defined" errors
	if (typeof window !== "undefined" && (!setFormData || !updateFormData)) {
		debugLogger.error(
			"INIT",
			"Critical: setFormData or updateFormData is undefined",
			{
				hasSetFormData: !!setFormData,
				hasUpdateFormData: !!updateFormData,
				signupStateKeys: Object.keys(signupState),
			},
		);
		// Don't throw - let component render and hook will initialize
	}

	const { announce, Announcement } = useAriaAnnounce();

	// Simplified submission state
	const [submissionProgress, setSubmissionProgress] = useState(0);
	const [submissionStage, setSubmissionStage] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isMounted, setIsMounted] = useState(false);

	// Form persistence hook
	// SignupFormData is compatible with FormDataType since it contains all required fields
	const { clearProgress, savePreferencesForMatches } = useFormPersistence(
		formData as unknown as FormDataType,
		updateFormData as unknown as React.Dispatch<
			React.SetStateAction<FormDataType>
		>,
		{ tier: "free", hasStep: true, minStepForSave: 1 },
		setStep,
		step,
	);

	// Ref to track redirect timeout for cleanup
	const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Test Sentry on component mount (only in development)
	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			// Send a test message to verify Sentry is working
			Sentry.captureMessage("SignupFormFree component mounted - Sentry test", {
				level: "info",
				tags: {
					component: "SignupFormFree",
					test: "component_mount",
					environment: process.env.NODE_ENV,
				},
			});
		}
	}, []);

	// Global error handler for unhandled errors
	useEffect(() => {
		const handleUnhandledError = (event: ErrorEvent) => {
			console.error("🚨 UNHANDLED ERROR in SignupFormFree:", event.error);
			Sentry.captureException(event.error, {
				tags: {
					component: "SignupFormFree",
					error_type: "unhandled_error",
					step: step.toString(),
				},
				extra: {
					message: event.message,
					filename: event.filename,
					lineno: event.lineno,
					colno: event.colno,
					formData: {
						email: formData.email,
						step: step,
					},
				},
			});
		};

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			console.error("🚨 UNHANDLED PROMISE REJECTION in SignupFormFree:", event.reason);
			Sentry.captureException(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
				tags: {
					component: "SignupFormFree",
					error_type: "unhandled_promise_rejection",
					step: step.toString(),
				},
				extra: {
					reason: event.reason,
					formData: {
						email: formData.email,
						step: step,
					},
				},
			});
		};

		window.addEventListener('error', handleUnhandledError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleUnhandledError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	}, [step, formData.email]);

	// Cleanup timeout on unmount - but preserve redirect if signup was successful
	// Store redirect URL in sessionStorage so it persists even if component unmounts
	useEffect(() => {
		return () => {
			// If we have a pending redirect, store it in sessionStorage as a fallback
			if (redirectTimeoutRef.current && typeof window !== "undefined") {
				const pendingRedirect = sessionStorage.getItem("pendingRedirect");
				if (!pendingRedirect) {
					// No pending redirect stored, safe to clear
					clearTimeout(redirectTimeoutRef.current);
				}
				// If there's a pending redirect, let it complete
			}
		};
	}, []);

	// Clear validation errors and signup errors when navigating to a new step
	// This prevents errors from previous steps or failed submissions from persisting
	// Following production-first approach: only show errors when they're relevant to current step
	useEffect(() => {
		debugLogger.step("STEP_CHANGE", "Step navigation", {
			newStep: step,
			isSubmitting,
			hasError: !!signupError,
		});

		// Clear validation errors when step changes (unless currently submitting)
		if (!isSubmitting) {
			setValidationErrors({});
			// Also clear signup state error when navigating to a new step
			if (signupError) {
				debugLogger.debug("STEP_CHANGE", "Clearing previous errors");
				setError("");
			}
			// Clear touched fields when changing steps to prevent stale error states
			setTouchedFields(new Set());
		}
	}, [step, isSubmitting, signupError]); // Clear errors whenever step changes

	// Mark component as mounted to prevent hydration mismatches
	useEffect(() => {
		setIsMounted(true);
		debugLogger.step("MOUNT", "Component mounted successfully", {
			step,
			hasFormData: !!formData,
		});
	}, []);

	// Clear errors on initial mount - always clear to prevent stale errors from persisting
	// This handles cases where users navigate directly to /signup/free?step=2 with stale errors
	// Also handles race conditions where errors might persist from previous sessions
	useEffect(() => {
		// Always clear errors on mount - defensive approach to prevent phantom errors
		setValidationErrors({});
		setError("");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run on mount - clear any stale errors from previous sessions

	// Form validation hooks
	const emailValidation = useEmailValidation(formData.email);

	// Use free signup navigation hook
	const navigation = useFreeSignupNavigation({
		step,
		formData,
		setStep,
		emailValidation,
		announce,
	});

	// Simplified submit handler with essential validation only
	const handleSubmit = useCallback(async () => {
		if (loading || isSubmitting) {
			return;
		}

		// Simple client-side validation
		if (!formData.fullName?.trim() || !formData.email?.trim() || 
			!formData.cities?.length || !formData.careerPath?.length || 
			!formData.gdprConsent) {
			setError("Please complete all required fields");
			return;
		}

		// Basic email validation
		const basicEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!emailValidation.isValid && !basicEmailRegex.test(formData.email.trim())) {
			setError("Please enter a valid email address");
			return;
		}

		setIsSubmitting(true);
		setLoading(true);
		setError("");
		setSubmissionProgress(0);
		setSubmissionStage("Finding your matches...");

		try {
			// Simple progress tracking
			setSubmissionProgress(20);
			setSubmissionStage("Analyzing your preferences...");
			
			await new Promise((resolve) => setTimeout(resolve, 500));
			setSubmissionProgress(50);

			// Prepare API data
			const apiData = {
				email: formData.email,
				full_name: formData.fullName,
				cities: formData.cities || [],
				careerPath: formData.careerPath || [],
				entryLevelPreferences: formData.entryLevelPreferences || [],
				visaStatus: "", // Defaults to "EU citizen" in API
				terms_accepted: formData.gdprConsent === true,
				age_verified: formData.gdprConsent === true,
			};

			const response = await apiCallJson<{
				userId: string;
				email: string;
				matchesCount: number;
				success?: boolean;
				error?: string;
				message?: string;
			}>("/api/signup/free", {
				method: "POST",
				body: JSON.stringify(apiData),
			});

			if (!response) {
				throw new Error("No response from server");
			}

			setSubmissionProgress(80);
			setSubmissionStage("Preparing your matches...");

			// Handle zero matches gracefully
			if (response.matchesCount === 0) {
				showToast.info(
					response.message || "We couldn't find matches for your criteria. Try adjusting your preferences."
				);
			}

			setSuccessState({
				show: true,
				matchesCount: response.matchesCount,
			});

			setSubmissionProgress(100);
			setSubmissionStage("Complete! Redirecting...");

			// Save preferences and redirect
			savePreferencesForMatches(formData as unknown as FormDataType);
			clearProgress();

			const redirectUrl = `/matches?tier=free&email=${encodeURIComponent(response.email)}`;
			
			if (typeof window !== "undefined") {
				sessionStorage.setItem("pendingRedirect", redirectUrl);
				sessionStorage.setItem("signupEmail", response.email);
			}
			
			redirectTimeoutRef.current = setTimeout(() => {
				if (typeof window !== "undefined") {
					sessionStorage.removeItem("pendingRedirect");
				}
				window.location.href = redirectUrl;
			}, TIMING.REDIRECT_DELAY_MS);
		} catch (error) {
			setSubmissionProgress(0);
			setSubmissionStage("");

			let userFacingErrorMessage = "Unable to connect. Please try again.";

			if (error instanceof ApiError) {
				userFacingErrorMessage = error.message;

				// Handle account already exists
				if (error.status === 409) {
					const errorResponse = error.response;
					
					if (errorResponse?.redirectToMatches) {
						showToast.success("Welcome back! Taking you to your matches...");
						clearProgress();
						setTimeout(() => router.push("/matches"), 1500);
						return;
					} else {
						userFacingErrorMessage = "This email is already registered";
					}
				}
			}

			setError(userFacingErrorMessage);
			showToast.error(userFacingErrorMessage);
		} finally {
			setLoading(false);
			setIsSubmitting(false);
		}
	}, [
		loading,
		formData,
		router,
		setLoading,
		setError,
		setSuccessState,
		clearProgress,
		emailValidation,
	]);

	// Helper functions
	const shouldShowError = useCallback(
		(_fieldName: string, hasValue: boolean, isValid: boolean) => {
			return hasValue && !isValid;
		},
		[],
	);

	const getDisabledMessage = useCallback(
		(stepNumber: number) => {
			switch (stepNumber) {
				case 1:
					return !formData.fullName.trim() ||
						!formData.email.trim() ||
						!emailValidation.isValid
						? "Enter your details"
						: "Continue";
				case 2:
					return formData.cities.length === 0 ? "Select cities" : "Continue";
				default:
					return "Continue";
			}
		},
		[formData, emailValidation],
	);

	return (
		<div className="min-h-screen bg-surface-base relative overflow-hidden pb-[max(1.5rem,env(safe-area-inset-bottom))]">
			{/* Background Effects - Simplified for mobile */}
			<div
				className="absolute inset-0 enhanced-grid opacity-30 pointer-events-none"
				aria-hidden="true"
			/>
			{/* Remove performance-killing infinite animation */}
			<div
				className="absolute top-20 right-10 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl hidden sm:block opacity-30 pointer-events-none"
				aria-hidden="true"
			/>

			{/* Hero Section */}
			<HeroSectionFree
				activeJobs={activeJobs}
				totalUsers={totalUsers}
				isLoadingStats={isLoadingStats}
			/>

			{/* Progress Bar */}
			<div className="sticky top-[-1px] z-40 bg-surface-base/90 backdrop-blur-md border-b border-white/10 mb-6 shadow-lg">
				<div className="h-1.5 bg-zinc-800/80 relative overflow-hidden">
					<motion.div
						className="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
						initial={{ width: 0 }}
						animate={{ width: `${(step / 3) * 100}%` }}
						transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
					/>
				</div>
			</div>

			{/* Form Steps Container */}
			<div className="flex-1 flex items-center justify-center p-4">
				<div className="w-full max-w-2xl">
					{/* Enhanced Submission Progress with Loading States */}
					{isSubmitting && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
						>
							<div className="bg-slate-900/95 border border-white/20 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
								{/* Animated loading spinner */}
								<div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-6"></div>

								<h3 className="text-xl font-bold text-white mb-2">
									{submissionStage || "Processing..."}
								</h3>
								<p className="text-zinc-300 text-sm mb-6">
									We're finding your perfect matches across Europe
								</p>

								{/* Enhanced progress bar */}
								<div className="space-y-3">
									<div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
										<div
											className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out"
											style={{ width: `${submissionProgress}%` }}
										></div>
									</div>
									<p className="text-xs text-zinc-400">
										{submissionProgress}% complete
									</p>
								</div>

								{/* Animated dots */}
								<div className="flex justify-center gap-1 mt-4">
									<div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
									<div
										className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
										style={{ animationDelay: "0.1s" }}
									></div>
									<div
										className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
										style={{ animationDelay: "0.2s" }}
									></div>
								</div>
							</div>
						</motion.div>
					)}

					{/* Simple Error Display */}
					{signupError && !isSubmitting && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className="mb-6"
						>
							<Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
								<span className="text-red-400 text-sm">⚠️</span>
								<AlertTitle className="text-red-400 font-medium">
									{signupError}
								</AlertTitle>
							</Alert>
						</motion.div>
					)}

					{/* Step content */}
					<div className="text-white text-center">
						{step === 1 && (
							<Step1FreeBasics
								key="step1"
								formData={formData}
								setFormData={setFormData}
								loading={loading}
								setStep={navigation.navigateToStep}
								emailValidation={emailValidation}
							/>
						)}
						{step === 2 && (
							<Step2FreeCities
								key="step2"
								formData={formData}
								setFormData={setFormData}
								loading={loading}
								setStep={navigation.navigateToStep}
							/>
						)}
						{step === 3 && (
							<>
								<Step3FreeCareer
									key="step3"
									formData={formData}
									setFormData={setFormData}
									loading={loading}
									setStep={navigation.navigateToStep}
									handleSubmit={handleSubmit}
								/>
								{/* Live Preview: Show matching jobs when user selects career path */}
								<LiveJobsReview
									cities={formData.cities}
									careerPath={formData.careerPath[0] || ""}
									isVisible={
										formData.cities.length > 0 && formData.careerPath.length > 0
									}
									className="mt-8"
								/>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Trust Signals */}
			<TrustSignals activeJobs={activeJobs} isLoadingStats={isLoadingStats} />

			{/* Announcement for screen readers */}
			{Announcement}
		</div>
	);
}

export default function SignupFormFreeWrapper() {
	return (
		<ErrorBoundary>
			<Suspense
				fallback={
					<PageLoading
						title="Finding your perfect matches"
						subtitle="This takes just a moment..."
					/>
				}
			>
				<SignupFormFree />
			</Suspense>
		</ErrorBoundary>
	);
}
