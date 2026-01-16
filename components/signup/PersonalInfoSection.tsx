import { FormFieldError } from "../ui/FormFieldFeedback";
import { UseSignupFormReturn } from "@/hooks/useSignupForm";

interface PersonalInfoSectionProps {
	formState: UseSignupFormReturn;
	isSubmitting: boolean;
}

export function PersonalInfoSection({ formState, isSubmitting }: PersonalInfoSectionProps) {
	const { formData, setFormData, setTouchedFields, emailValidation, nameValidation, shouldShowError } = formState;

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({ ...prev, email: e.target.value }));
	};

	const handleEmailBlur = () => {
		setTouchedFields((prev) => new Set(prev).add("email"));
	};

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({ ...prev, fullName: e.target.value }));
	};

	const handleNameBlur = () => {
		setTouchedFields((prev) => new Set(prev).add("fullName"));
	};

	return (
		<div className="grid gap-6 sm:grid-cols-2">
			{/* University Field */}
			<div>
				<label
					htmlFor="university"
					className="block text-base font-bold text-white mb-3"
				>
					University (Optional)
				</label>
				<input
					id="university"
					type="text"
					disabled={isSubmitting}
					value={formData.university || ""}
					onChange={(e) => setFormData((prev) => ({ ...prev, university: e.target.value }))}
					placeholder="e.g., University of Oxford"
					autoComplete="organization"
					inputMode="text"
					style={{ fontSize: '16px' }} // Prevent iOS zoom
					className="w-full px-4 py-4 sm:py-3 min-h-[52px] sm:min-h-[48px] bg-black/50 border-2 rounded-xl text-white placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/30 transition-all text-base font-medium backdrop-blur-sm border-border-default disabled:opacity-50 disabled:cursor-not-allowed"
				/>
				<p className="text-sm text-content-secondary mt-2">
					Helps us match you with graduate programs and internships.
				</p>
			</div>

			{/* Email Field */}
			<div>
				<label
					htmlFor="email"
					className="block text-base font-bold text-white mb-3"
				>
					Email Address *
				</label>
				<input
					id="email"
					type="email"
					required
					disabled={isSubmitting}
					value={formData.email}
					onChange={handleEmailChange}
					onBlur={handleEmailBlur}
					placeholder="you@example.com"
					autoComplete="email"
					inputMode="email"
					style={{ fontSize: '16px' }} // Prevent iOS zoom
					aria-describedby={
						formData.email.length > 0
							? emailValidation.isValid
								? "email-success"
								: "email-error"
							: undefined
					}
					aria-invalid={
						formData.email.length > 0 && !emailValidation.isValid
					}
					className="w-full px-4 py-4 sm:py-3 min-h-[52px] sm:min-h-[48px] bg-black/50 border-2 rounded-xl text-white placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/30 transition-all text-base font-medium backdrop-blur-sm border-border-default disabled:opacity-50 disabled:cursor-not-allowed"
				/>
				<p className="text-sm text-content-secondary mt-2">
					We won't email you. Ever.
				</p>
				{shouldShowError(
					"email",
					!!formData.email,
					emailValidation.isValid,
				) && (
					<FormFieldError
						error={emailValidation.error || "Invalid email"}
						id="email-error"
					/>
				)}
			</div>

			<div>
				<label
					htmlFor="fullName"
					className="block text-base font-bold text-white mb-3"
				>
					Full Name *
				</label>
				<input
					id="fullName"
					type="text"
					required
					disabled={isSubmitting}
					value={formData.fullName}
					onChange={handleNameChange}
					onBlur={handleNameBlur}
					placeholder="Jane Doe"
					autoComplete="name"
					autoCorrect="off"
					autoCapitalize="words"
					inputMode="text"
					style={{ fontSize: '16px' }} // Prevent iOS zoom
					aria-describedby={
						formData.fullName.length > 0
							? nameValidation.isValid
								? "fullName-success"
								: "fullName-error"
							: undefined
					}
					aria-invalid={
						formData.fullName.length > 0 && !nameValidation.isValid
					}
					className="w-full px-4 py-4 sm:py-3 min-h-[52px] sm:min-h-[48px] bg-black/50 border-2 rounded-xl text-white placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/30 transition-all text-base font-medium backdrop-blur-sm border-border-default disabled:opacity-50 disabled:cursor-not-allowed"
				/>
				{shouldShowError(
					"fullName",
					!!formData.fullName,
					nameValidation.isValid,
				) && (
					<FormFieldError
						error={nameValidation.error || "Name is required"}
						id="fullName-error"
					/>
				)}
			</div>
		</div>
	);
}