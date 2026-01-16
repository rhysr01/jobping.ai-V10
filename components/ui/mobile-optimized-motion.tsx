import { MotionProps, motion } from "framer-motion";
import { ReactNode } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { cn } from "@/lib/utils";
import { LazyInteraction } from "./intersection-observer";

interface MobileOptimizedMotionProps extends Omit<MotionProps, "style"> {
	children: ReactNode;
	style?: React.CSSProperties;
	className?: string;
	disableOnMobile?: boolean;
	simplifiedOnMobile?: boolean;
}

export function MobileOptimizedMotion({
	children,
	className,
	disableOnMobile = false,
	simplifiedOnMobile = false,
	...motionProps
}: MobileOptimizedMotionProps) {
	const { isMobile } = useWindowSize();

	// Completely disable motion on mobile for performance
	if (disableOnMobile && isMobile) {
		return (
			<div className={cn(className)} style={motionProps.style}>
				{children}
			</div>
		);
	}

	// Simplify motion on mobile (reduce animations)
	if (simplifiedOnMobile && isMobile) {
		const simplifiedProps = { ...motionProps };
		// Remove complex animations on mobile
		delete simplifiedProps.whileHover;
		delete simplifiedProps.whileTap;
		delete simplifiedProps.animate;

		return (
			<motion.div className={cn(className)} {...simplifiedProps}>
				{children}
			</motion.div>
		);
	}

	// Full motion on desktop
	return (
		<motion.div className={cn(className)} {...motionProps}>
			{children}
		</motion.div>
	);
}

// Performance-optimized hover wrapper
interface OptimizedHoverProps
	extends Omit<MobileOptimizedMotionProps, "whileHover"> {
	whileHover?: MotionProps["whileHover"];
	children: ReactNode;
	useIntersection?: boolean; // Enable intersection observer for performance
}

export function OptimizedHover({
	children,
	whileHover,
	className,
	useIntersection = false,
	...props
}: OptimizedHoverProps) {
	const { isMobile } = useWindowSize();

	// If using intersection observer, only enable hover when visible
	if (useIntersection && !isMobile) {
		return (
			<LazyInteraction className={className}>
				{(isVisible) => (
					<MobileOptimizedMotion
						whileHover={isVisible ? whileHover : undefined}
						disableOnMobile={false}
						{...props}
					>
						{children}
					</MobileOptimizedMotion>
				)}
			</LazyInteraction>
		);
	}

	return (
		<MobileOptimizedMotion
			className={className}
			whileHover={isMobile ? undefined : whileHover} // Disable hover on mobile
			disableOnMobile={false}
			{...props}
		>
			{children}
		</MobileOptimizedMotion>
	);
}
