"use client";

import { motion } from "framer-motion";
import React from "react";
import { BrandIcons } from "./BrandIcons";

interface SharedButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	loading?: boolean;
	variant?: "primary" | "secondary" | "outline";
	size?: "sm" | "md" | "lg";
	fullWidth?: boolean;
	icon?: keyof typeof BrandIcons;
	className?: string;
}

export const SharedButton = React.memo(function SharedButton({
	children,
	onClick,
	disabled = false,
	loading = false,
	variant = "primary",
	size = "md",
	fullWidth = false,
	icon,
	className = "",
}: SharedButtonProps) {
	const IconComponent = icon ? BrandIcons[icon] : null;

	const baseClasses = "font-bold rounded-xl transition-all touch-manipulation flex items-center justify-center gap-2";

	const variantClasses = {
		primary: "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg hover:shadow-xl",
		secondary: "bg-zinc-700/50 hover:bg-zinc-600/50 text-white",
		outline: "border-2 border-brand-500/50 bg-transparent hover:bg-brand-500/10 text-white",
	};

	const sizeClasses = {
		sm: "px-4 py-3 text-sm min-h-[44px]",
		md: "px-6 py-4 text-base min-h-[56px]",
		lg: "px-8 py-5 text-lg min-h-[64px]",
	};

	const widthClass = fullWidth ? "w-full" : "";

	const disabledClass = disabled || loading ? "opacity-50 cursor-not-allowed" : "";

	return (
		<motion.button
			onClick={onClick}
			disabled={disabled || loading}
			whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
			whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
			className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${className}`}
		>
			{loading && (
				<svg
					className="w-5 h-5 animate-spin"
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
					/>
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					/>
				</svg>
			)}
			{IconComponent && !loading && <IconComponent className="w-5 h-5" />}
			{loading ? "Loading..." : children}
		</motion.button>
	);
});