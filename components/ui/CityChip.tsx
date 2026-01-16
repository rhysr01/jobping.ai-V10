"use client";

import { BrandIcons } from "./BrandIcons";
import { OptimizedHover } from "./mobile-optimized-motion";

interface CityChipProps {
	city: string;
	isSelected: boolean;
	isDisabled: boolean;
	onToggle: (city: string) => void;
	onRemove?: (city: string) => void; // Optional - for X icon
	className?: string;
}

export function CityChip({
	city,
	isSelected,
	isDisabled,
	onToggle,
	onRemove,
	className = "",
}: CityChipProps) {
	return (
		<OptimizedHover
			whileHover={{
				scale: isDisabled ? 1 : 1.02,
				transition: { duration: 0.2, ease: "easeOut" },
			}}
			whileTap={{
				scale: isDisabled ? 1 : 0.98,
				transition: { duration: 0.1 },
			}}
			className={`
        relative flex items-center snap-center shrink-0
        mobile-chip px-6 rounded-full border-2
        transition-all touch-manipulation
        ${
					isSelected
						? "bg-brand-500/20 border-brand-500 text-white pr-14 shadow-lg shadow-brand-500/25" // More padding for X button on mobile
						: isDisabled
							? "bg-zinc-900/40 border-zinc-800 text-zinc-500 cursor-not-allowed"
							: "bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-brand-400/50 hover:shadow-md hover:shadow-brand-500/10"
				}
        ${className}
      `}
		>
			<button
				type="button"
				onClick={() => !isDisabled && onToggle(city)}
				disabled={isDisabled}
				onTouchStart={() => {
					if (!isDisabled && "vibrate" in navigator) {
						navigator.vibrate(10); // Haptic feedback
					}
				}}
				aria-label={`${city}${isSelected ? " (selected)" : ""}`}
				aria-pressed={isSelected}
				aria-disabled={isDisabled}
				className="w-full h-full flex items-center justify-center"
			>
				{city}
				{isSelected && onRemove && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onRemove(city);
						}}
						className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors touch-manipulation"
						aria-label={`Remove ${city}`}
					>
						<BrandIcons.X className="w-4 h-4" />
					</button>
				)}
			</button>
		</OptimizedHover>
	);
}
