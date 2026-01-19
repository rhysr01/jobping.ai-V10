"use client";

import { lazy, ReactNode, Suspense } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";

// Dynamic import for framer-motion to reduce bundle size
const MotionDiv = lazy(() =>
	import("framer-motion").then((mod) => ({ default: mod.motion.div })),
);

interface MobileOptimizedMotionProps {
	children: ReactNode;
	className?: string;
	// Animation props - simplified to most common ones to reduce bundle impact
	initial?: any;
	animate?: any;
	exit?: any;
	transition?: any;
	whileHover?: any;
	whileTap?: any;
	whileInView?: any;
	variants?: any;
}

/**
 * MobileOptimizedMotion - Conditionally disables Framer Motion animations on mobile
 *
 * On mobile devices (screen width < 1024px), this component renders as a regular div
 * to improve performance by avoiding expensive animation calculations.
 *
 * On desktop, it renders as motion.div with full animation support.
 *
 * Usage:
 * ```tsx
 * <MobileOptimizedMotion
 *   whileHover={{ scale: 1.02 }}
 *   whileTap={{ scale: 0.98 }}
 * >
 *   <div>Content</div>
 * </MobileOptimizedMotion>
 * ```
 */
export function MobileOptimizedMotion({
	children,
	className,
	...motionProps
}: MobileOptimizedMotionProps) {
	const { isMobile } = useWindowSize();

	// On mobile, render as regular div without motion props
	if (isMobile) {
		return <div className={className}>{children}</div>;
	}

	// On desktop, render as dynamically imported motion component
	return (
		<Suspense fallback={<div className={className}>{children}</div>}>
			<MotionDiv className={className} {...motionProps}>
				{children}
			</MotionDiv>
		</Suspense>
	);
}

// Export default for easier importing
export default MobileOptimizedMotion;
