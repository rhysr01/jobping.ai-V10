"use client";

import { BrandIcons } from "./BrandIcons";

interface FormFieldErrorProps {
	error?: string;
	id?: string;
}

/**
 * Enhanced form field error component with smooth animations
 */
export function FormFieldError({ error, id }: FormFieldErrorProps) {
	if (!error) return null;

	return (
		<p
			id={id}
			className="mt-2 text-sm text-red-400 flex items-center gap-2 font-medium animate-in slide-in-from-top-1 duration-200"
			role="alert"
			aria-live="polite"
		>
			<BrandIcons.AlertCircle className="w-4 h-4 flex-shrink-0" />
			{error}
		</p>
	);
}

interface FormFieldSuccessProps {
	message?: string;
	id?: string;
}

/**
 * Form field success indicator
 */
export function FormFieldSuccess({ message, id }: FormFieldSuccessProps) {
	if (!message) return null;

	return (
		<p
			id={id}
			className="mt-2 text-sm text-green-400 flex items-center gap-2 font-medium animate-in slide-in-from-top-1 duration-200"
			role="status"
			aria-live="polite"
		>
			<BrandIcons.CheckCircle className="w-4 h-4 flex-shrink-0" />
			{message}
		</p>
	);
}

interface FormFieldHelperProps {
	helper?: string;
	characterCount?: number;
	maxLength?: number;
}

/**
 * Form field helper text with optional character count
 */
export function FormFieldHelper({
	helper,
	characterCount,
	maxLength,
}: FormFieldHelperProps) {
	if (!helper && (!characterCount || !maxLength)) return null;

	return (
		<div className="mt-2 flex items-center justify-between">
			{helper && <p className="text-xs text-content-muted">{helper}</p>}
			{characterCount !== undefined && maxLength && (
				<p
					className={`text-xs ${characterCount > maxLength * 0.9 ? "text-yellow-400" : "text-content-muted"}`}
				>
					{characterCount}/{maxLength}
				</p>
			)}
		</div>
	);
}
