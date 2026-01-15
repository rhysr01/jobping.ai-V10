"use client";

import React from "react";
import {
	FormFieldError,
	FormFieldSuccess,
} from "./FormFieldFeedback";

interface SharedFormFieldProps {
	id: string;
	label: string;
	required?: boolean;
	type?: string;
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	placeholder?: string;
	error?: string;
	success?: string;
	helpText?: string;
	autoComplete?: string;
	inputMode?: "text" | "email" | "tel" | "url" | "numeric" | "decimal";
	disabled?: boolean;
	className?: string;
}

export const SharedFormField = React.memo(function SharedFormField({
	id,
	label,
	required = false,
	type = "text",
	value,
	onChange,
	onBlur,
	placeholder,
	error,
	success,
	helpText,
	autoComplete,
	inputMode,
	disabled = false,
	className = "",
}: SharedFormFieldProps) {
	return (
		<div className={className}>
			<label
				htmlFor={id}
				className="block text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center gap-2"
			>
				<span>{label}</span>
				{required && (
					<span className="text-red-400 text-sm" aria-label="required">*</span>
				)}
			</label>

			{helpText && (
				<p id={`${id}-help`} className="text-sm font-medium text-zinc-300 mb-3 sm:mb-4 leading-relaxed">
					{helpText}
				</p>
			)}

			<input
				id={id}
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onBlur={onBlur}
				placeholder={placeholder}
				autoComplete={autoComplete}
				inputMode={inputMode}
				disabled={disabled}
				className={`w-full px-4 sm:px-6 py-4 sm:py-5 min-h-[56px] bg-black/50 border-2 rounded-xl sm:rounded-2xl text-white placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/30 focus:ring-offset-2 focus:ring-offset-black transition-all text-base sm:text-lg font-medium backdrop-blur-sm touch-manipulation ${
					value
						? success && !error
							? "border-green-500/60 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
							: error
								? "border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
								: "border-zinc-700"
						: "border-zinc-700 hover:border-zinc-600"
				}`}
				aria-invalid={!!error}
				aria-describedby={
					error
						? `${id}-error ${helpText ? `${id}-help` : ""}`
						: success
							? `${id}-success ${helpText ? `${id}-help` : ""}`
							: helpText
								? `${id}-help`
								: undefined
				}
				aria-required={required}
			/>

			{/* Error/Success Messages */}
			{value && (
				success && !error ? (
					<FormFieldSuccess message={success} id={`${id}-success`} />
				) : error ? (
					<FormFieldError error={error} id={`${id}-error`} />
				) : null
			)}
		</div>
	);
});