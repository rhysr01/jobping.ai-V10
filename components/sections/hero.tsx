"use client";

import { memo } from "react";
import { trackEvent } from "../../lib/analytics";
import {
	CTA_GET_MY_5_FREE_MATCHES,
	CTA_GET_MY_5_FREE_MATCHES_ARIA,
	HERO_HEADLINE,
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
			{/* Simplified background - just dot grid and one gradient */}
			<div
				className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40"
				aria-hidden="true"
			/>

			{/* Single gradient glow - clean and focused */}
			<div
				className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent blur-3xl"
				aria-hidden="true"
			/>

			{/* Main content */}
			<div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8">
				<div className="text-center">
					{/* Headline */}
					<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
						<span className="block text-white leading-[1.1] mb-2">{HERO_HEADLINE}</span>
						<span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent leading-[1.1]">
							matched to you
						</span>
					</h1>

					{/* Subheadline */}
					<p className="text-lg sm:text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-3xl mx-auto mb-8">
						{HERO_SUBLINE}
					</p>

					{/* Social proof badge */}
					<div className="flex justify-center mb-10">
						<div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
							<div className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
							</div>
							<span className="text-sm font-semibold text-emerald-400">{HERO_PILL}</span>
						</div>
					</div>

					{/* CTA button */}
					<CustomButton
						href="/signup/free"
						onClick={() => {
							trackEvent("cta_clicked", { type: "free", location: "hero" });
						}}
						variant="primary"
						size="xl"
						aria-label={CTA_GET_MY_5_FREE_MATCHES_ARIA}
					>
						{CTA_GET_MY_5_FREE_MATCHES}
						<BrandIcons.ArrowRight className="h-5 w-5" />
					</CustomButton>
				</div>
			</div>
		</section>
	);
}

export default memo(Hero);
