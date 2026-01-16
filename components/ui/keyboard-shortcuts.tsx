"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function KeyboardShortcuts() {
	const router = useRouter();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Skip if user is typing in an input
			const target = e.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
				return;
			}

			// Cmd/Ctrl + K: Focus search (if exists)
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				// Could implement search focus here
			}

			// Cmd/Ctrl + /: Show help
			if ((e.metaKey || e.ctrlKey) && e.key === '/') {
				e.preventDefault();
				// Could show keyboard shortcuts help
			}

			// Escape: Close modals/overlays
			if (e.key === 'Escape') {
				// Close any open modals, mobile menus, etc.
				const mobileMenu = document.querySelector('[role="dialog"]');
				if (mobileMenu) {
					// Trigger mobile menu close
					const closeButton = mobileMenu.querySelector('[aria-label="Close"]') as HTMLElement;
					if (closeButton) {
						closeButton.click();
					}
				}
			}

			// H: Go to home
			if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
				router.push('/');
			}

			// J: Go to jobs/matches
			if (e.key === 'j' && !e.ctrlKey && !e.metaKey) {
				router.push('/matches');
			}

			// P: Go to pricing
			if (e.key === 'p' && !e.ctrlKey && !e.metaKey) {
				router.push('/pricing');
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [router]);

	return null; // This component doesn't render anything
}