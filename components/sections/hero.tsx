"use client";

import { memo } from "react";
import { trackEvent } from "../../lib/analytics";
import {
	CTA_GET_5_FREE_MATCHES,
	CTA_GET_MY_5_FREE_MATCHES_ARIA,
	HERO_HEADLINE,
	HERO_HEADLINE_ACCENT,
	HERO_SUBLINE,
	HERO_PILL,
} from "../../lib/copy";
import CustomButton from "../ui/CustomButton";
import { BrandIcons } from "../ui/BrandIcons";

function Hero() {
	return (
		<section
			data-testid="hero-section"
			className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden bg-black"
		>
			{/* Enhanced background with more visible grid and multiple layers */}
			<div
				className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
				aria-hidden="true"
			/>

			{/* Enhanced gradient glow with better positioning and multiple layers */}
			<div
				className="absolute left-1/2 top-0 -translate-x-1/2 blur-[120px] opacity-20"
				aria-hidden="true"
			>
				<div className="aspect-square w-[600px] rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400"></div>
			</div>

			{/* Additional subtle glow for more depth */}
			<div
				className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl opacity-60"
				aria-hidden="true"
			/>
			<div
				className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl opacity-40"
				aria-hidden="true"
			/>

			{/* Main content */}
			<div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8">
				<div className="text-center">
					{/* Top Badge - reduced margin for better spacing */}
					<div className="flex justify-center mb-6">
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md">
							<div className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
							</div>
							<span className="text-sm font-medium text-emerald-400">{HERO_PILL}</span>
						</div>
					</div>

					{/* Enhanced Headline with premium typography and gradient */}
					<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-[-0.12em] mb-8">
						<span className="block text-white leading-[1.1] mb-2">{HERO_HEADLINE}</span>
						<span className="block bg-gradient-to-r from-teal-300 to-emerald-500 bg-clip-text text-transparent leading-[1.1]">
							{HERO_HEADLINE_ACCENT}
						</span>
					</h1>

					{/* Improved Subheadline with better spacing and readability */}
					<p className="text-lg leading-relaxed text-slate-400 max-w-2xl mx-auto mb-10">
						{HERO_SUBLINE}
					</p>

					{/* Enhanced CTA section */}
					<div className="flex flex-col items-center gap-4">
						<CustomButton
							href="/signup/free"
							onClick={() => {
								trackEvent("cta_clicked", { type: "free", location: "hero" });
							}}
							variant="primary"
							size="xl"
							aria-label={CTA_GET_MY_5_FREE_MATCHES_ARIA}
							className="group h-14 rounded-full bg-emerald-500 px-8 text-lg font-bold text-black transition-all duration-200 hover:scale-105 hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95"
						>
							{CTA_GET_5_FREE_MATCHES}
							<BrandIcons.ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
						</CustomButton>
						
						{/* Social proof with better contrast */}
						<div className="flex items-center gap-2 text-sm text-slate-400">
							<BrandIcons.CheckCircle className="h-4 w-4 text-emerald-500" />
							<span>Join 1,000+ students from top EU universities</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default memo(Hero);
