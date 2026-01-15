"use client";

import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";

export default function AnimatedBackground() {
	// Prevent SSR issues by ensuring we're on client
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	const { scrollY } = useScroll();
	const [isMobile, setIsMobile] = useState(false);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		setIsMobile(window.innerWidth < 768);
		setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
	}, []);

	// Optimized parallax transforms based on device
	const parallaxSlow = useTransform(scrollY, [0, 1000], [0, isMobile ? 100 : 200]);
	const parallaxMedium = useTransform(scrollY, [0, 1000], [0, isMobile ? 200 : 400]);
	const parallaxFast = useTransform(scrollY, [0, 1000], [0, isMobile ? 300 : 600]);
	const opacityTransform = useTransform(scrollY, [0, 500], [1, 0.3]);

	// Mouse parallax values - only on desktop
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);

	// All transform hooks must be called unconditionally (Rules of Hooks)
	const orb1X = useTransform([mouseX, scrollY], ([mx, sy]: number[]) => (mx * 0.2) + (sy / 1000) * 150);
	const orb1Y = useTransform([mouseY, parallaxSlow], ([my, ps]: number[]) => (my * 0.2) + ps);
	const orb1Scale = useTransform(scrollY, [0, 1000], [1, isMobile ? 1.1 : 1.15]);

	const orb2X = useTransform([mouseX, scrollY], ([mx, sy]: number[]) => -(mx * 0.15) - (sy / 1000) * 120);
	const orb2Y = useTransform([mouseY, parallaxMedium], ([my, pm]: number[]) => -(my * 0.15) + pm);
	const orb2Scale = useTransform(scrollY, [0, 1000], [1, isMobile ? 1.15 : 1.2]);


	const orb3X = useTransform([mouseX, scrollY], ([mx, sy]: number[]) => (mx * 0.1) + (sy / 1000) * 90);
	const orb3Y = useTransform([mouseY, parallaxFast], ([my, pf]: number[]) => (my * 0.1) + pf);
	const orb3Scale = useTransform(scrollY, [0, 1000], [1, isMobile ? 1.2 : 1.25]);

	// Mouse parallax effect - disabled on mobile
	useEffect(() => {
		if (isMobile || prefersReducedMotion) return;

		const handleMouseMove = (e: MouseEvent) => {
			const x = (e.clientX / window.innerWidth - 0.5) * 30; // Reduced multiplier
			const y = (e.clientY / window.innerHeight - 0.5) * 30;
			mouseX.set(x);
			mouseY.set(y);
		};

		window.addEventListener("mousemove", handleMouseMove, { passive: true });
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, [mouseX, mouseY, isMobile, prefersReducedMotion]);

	// Prevent SSR hydration issues
	if (!isClient) {
		return <div className="fixed inset-0 -z-50 bg-gradient-to-br from-zinc-950 via-black to-zinc-950" />;
	}

	return (
		<div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
			{/* Base gradient with parallax */}
			<motion.div 
				className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950"
				style={{ y: parallaxSlow }}
			/>
			
			{/* Animated mesh gradients with parallax */}
			<motion.div 
				className="absolute inset-0 opacity-40"
				style={{ y: parallaxMedium, opacity: opacityTransform }}
			>
				<div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_100%_50%_at_0%_0%,rgba(16,185,129,0.15),transparent_60%)]" />
				<div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_100%_50%_at_100%_0%,rgba(59,130,246,0.12),transparent_60%)]" />
				<div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_50%_100%_at_50%_100%,rgba(139,92,246,0.10),transparent_60%)]" />
			</motion.div>
			
			{/* Optimized moving orbs - much simpler on mobile */}
			{!prefersReducedMotion && (
				<>
					{/* Only show one orb on mobile for performance */}
					{!isMobile ? (
						<>
							<motion.div
								className="absolute top-0 left-1/4 w-[600px] h-[600px] blur-[120px] bg-emerald-500/20 rounded-full"
								style={{
									x: orb1X,
									y: orb1Y,
									scale: orb1Scale,
								}}
								animate={{
									scale: [1, 1.05, 1],
								}}
								transition={{
									duration: 25,
									repeat: Infinity,
									ease: "easeInOut",
								}}
							/>
							<motion.div
								className="absolute top-1/3 right-0 w-[500px] h-[500px] blur-[100px] bg-blue-500/15 rounded-full"
								style={{
									x: orb2X,
									y: orb2Y,
									scale: orb2Scale,
								}}
								animate={{
									scale: [1, 1.1, 1],
								}}
								transition={{
									duration: 30,
									repeat: Infinity,
									ease: "easeInOut",
									delay: 3,
								}}
							/>
							<motion.div
								className="absolute bottom-0 left-1/2 w-[400px] h-[400px] blur-[90px] bg-purple-500/10 rounded-full"
								style={{
									x: orb3X,
									y: orb3Y,
									scale: orb3Scale,
								}}
								animate={{
									scale: [1, 1.15, 1],
								}}
								transition={{
									duration: 35,
									repeat: Infinity,
									ease: "easeInOut",
									delay: 6,
								}}
							/>
						</>
					) : (
						/* Single static orb on mobile */
						<motion.div
							className="absolute top-0 right-0 w-[300px] h-[300px] blur-[60px] bg-brand-500/10 rounded-full"
							style={{
								x: parallaxSlow,
								y: parallaxSlow,
							}}
						/>
					)}
				</>
			)}

			{/* Optimized particle count - significantly reduced on mobile */}
			<div className="absolute inset-0">
				{Array.from({ length: isMobile ? 3 : 8 }).map((_, i) => {
					const baseDelay = i * (isMobile ? 1 : 0.5); // Slower, less frequent on mobile
					const baseDuration = isMobile ? 20 + (i % 2) * 10 : 12 + (i % 3) * 6; // Much slower on mobile

					return (
						<motion.div
							key={i}
							className="absolute w-1 h-1 bg-emerald-400/10 rounded-full blur-sm"
							initial={{
								x: `${(i * 13) % 100}%`, // More spread out
								y: `${(i * 17) % 100}%`,
								opacity: 0,
							}}
							animate={prefersReducedMotion ? undefined : {
								y: [`${(i * 17) % 100}%`, `${((i * 17) % 100) - (isMobile ? 10 : 15)}%`, `${(i * 17) % 100}%`],
								opacity: [0, isMobile ? 0.2 : 0.4, 0], // Much more subtle on mobile
								scale: [0.3, isMobile ? 0.8 : 1.2, 0.3], // Smaller scale changes
							}}
							transition={prefersReducedMotion ? undefined : {
								duration: baseDuration,
								repeat: Infinity,
								delay: baseDelay,
								ease: "easeInOut",
							}}
						/>
					);
				})}
			</div>
			
			{/* Simplified noise texture */}
			<motion.div
				className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
					y: parallaxSlow,
				}}
			/>

			{/* Animated grid - completely disabled on mobile for performance */}
			{!isMobile && (
				<motion.div
					className={`absolute inset-0 opacity-[0.03] ${prefersReducedMotion ? '' : 'animated-grid'}`}
					aria-hidden="true"
					style={{ y: parallaxFast }}
				/>
			)}

			{/* Radial gradient overlay for depth */}
			<motion.div
				className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]"
				style={{ opacity: opacityTransform }}
			/>
		</div>
	);
}

