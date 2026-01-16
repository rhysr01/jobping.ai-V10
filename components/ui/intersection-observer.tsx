"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface IntersectionObserverProps {
	children: ReactNode;
	className?: string;
	threshold?: number;
	rootMargin?: string;
	disabled?: boolean;
	fallback?: ReactNode;
	onIntersect?: () => void;
}

/**
 * Performance optimization wrapper that only renders expensive content when in viewport
 * Reduces initial render time and improves scrolling performance for long lists
 */
export function IntersectionObserver({
	children,
	className = "",
	threshold = 0.1,
	rootMargin = "50px",
	disabled = false,
	fallback,
	onIntersect
}: IntersectionObserverProps) {
	const [isIntersecting, setIsIntersecting] = useState(disabled);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (disabled) {
			setIsIntersecting(true);
			return;
		}

		const element = ref.current;
		if (!element) return;

		const observer = new (IntersectionObserver as any)(
			(entries: IntersectionObserverEntry[]) => {
				const [entry] = entries;
				if (entry) {
					const intersecting = entry.isIntersecting;
					setIsIntersecting(intersecting);
					if (intersecting && onIntersect) {
						onIntersect();
					}
				}
			},
			{
				threshold,
				rootMargin
			}
		);

		observer.observe(element);

		return () => {
			try {
				observer.disconnect();
			} catch (e) {
				// Ignore cleanup errors
			}
		};
	}, [disabled, threshold, rootMargin, onIntersect]);

	// If disabled, always render children
	if (disabled) {
		return (
			<div className={className} ref={ref}>
				{children}
			</div>
		);
	}

	// Render fallback or nothing until intersecting
	if (!isIntersecting) {
		return fallback ? (
			<div className={className} ref={ref}>
				{fallback}
			</div>
		) : (
			<div className={className} ref={ref} />
		);
	}

	// Render full content when intersecting
	return (
		<div className={className} ref={ref}>
			{children}
		</div>
	);
}

/**
 * Higher-order component for expensive list items
 * Only renders expensive animations/interactions when item is visible
 */
interface LazyInteractionProps {
	children: (isVisible: boolean) => ReactNode;
	className?: string;
	threshold?: number;
	rootMargin?: string;
}

export function LazyInteraction({
	children,
	className = "",
	threshold = 0.2,
	rootMargin = "100px"
}: LazyInteractionProps) {
	const [isVisible, setIsVisible] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const observer = new (IntersectionObserver as any)(
			(entries: IntersectionObserverEntry[]) => {
				const [entry] = entries;
				if (entry) {
					setIsVisible(entry.isIntersecting);
				}
			},
			{ threshold, rootMargin }
		);

		observer.observe(element);

		return () => {
			try {
				observer.disconnect();
			} catch (e) {
				// Ignore cleanup errors
			}
		};
	}, [threshold, rootMargin]);

	return (
		<div className={className} ref={ref}>
			{children(isVisible)}
		</div>
	);
}