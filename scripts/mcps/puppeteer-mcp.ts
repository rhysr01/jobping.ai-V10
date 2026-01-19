import puppeteer, { Browser } from "puppeteer";

export class PuppeteerMCP {
	private browser: Browser | null = null;

	private async initBrowser(): Promise<void> {
		if (!this.browser) {
			this.browser = await puppeteer.launch({
				headless: true,
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--disable-dev-shm-usage",
					"--disable-accelerated-2d-canvas",
					"--no-first-run",
					"--no-zygote",
					"--single-process",
					"--disable-gpu",
				],
			});
		}
	}

	async takeScreenshot(args: any) {
		const {
			url,
			viewport = { width: 1280, height: 720 },
			fullPage = false,
			selector,
		} = args;

		try {
			await this.initBrowser();
			if (!this.browser) throw new Error("Browser not initialized");

			const page = await this.browser.newPage();
			await page.setViewport(viewport);

			await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

			let screenshotBuffer: Buffer;

			if (selector) {
				// Take screenshot of specific element
				await page.waitForSelector(selector);
				const element = await page.$(selector);
				if (!element)
					throw new Error(`Element with selector "${selector}" not found`);

				screenshotBuffer = (await element.screenshot({
					type: "png",
				})) as Buffer;
			} else {
				// Take full page or viewport screenshot
				screenshotBuffer = (await page.screenshot({
					fullPage,
					type: "png",
				})) as Buffer;
			}

			await page.close();

			// Convert to base64 for response
			const base64Image = screenshotBuffer.toString("base64");

			return {
				content: [
					{
						type: "text",
						text: `📸 Screenshot taken of ${url}\n• Viewport: ${viewport.width}x${viewport.height}\n• Full page: ${fullPage}\n• Selector: ${selector || "none"}\n• Image size: ${screenshotBuffer.length} bytes`,
					},
					{
						type: "image",
						data: base64Image,
						mimeType: "image/png",
					},
				],
			};
		} catch (error: any) {
			return {
				content: [
					{
						type: "text",
						text: `❌ Failed to take screenshot: ${error.message}`,
					},
				],
				isError: true,
			};
		}
	}

	async analyzePageDesign(args: any) {
		const { url, compareWith } = args;

		try {
			await this.initBrowser();
			if (!this.browser) throw new Error("Browser not initialized");

			const page = await this.browser.newPage();
			await page.setViewport({ width: 1280, height: 720 });

			await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

			// Analyze page design elements
			const designAnalysis = await page.evaluate(() => {
				const analysis = {
					title: document.title,
					headings: [] as string[],
					colors: [] as string[],
					fonts: [] as string[],
					layout: {
						hasHero: false,
						hasNavigation: false,
						hasFooter: false,
						responsive: false,
					},
					performance: {
						imagesWithoutAlt: 0,
						missingTitles: 0,
						largeImages: 0,
					},
					accessibility: {
						missingAltText: 0,
						poorContrast: 0,
						smallText: 0,
					},
				};

				// Headings analysis
				const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
				analysis.headings = Array.from(headings).map(
					(h) => `${h.tagName}: ${h.textContent?.trim()}`,
				);

				// Color analysis
				const colors = new Set<string>();
				const elements = document.querySelectorAll("*");
				elements.forEach((el) => {
					const style = window.getComputedStyle(el);
					if (style.color) colors.add(style.color);
					if (
						style.backgroundColor &&
						style.backgroundColor !== "rgba(0, 0, 0, 0)"
					)
						colors.add(style.backgroundColor);
				});
				analysis.colors = Array.from(colors).slice(0, 10);

				// Font analysis
				const fonts = new Set<string>();
				elements.forEach((el) => {
					const style = window.getComputedStyle(el);
					if (style.fontFamily) fonts.add(style.fontFamily);
				});
				analysis.fonts = Array.from(fonts).slice(0, 5);

				// Layout analysis
				analysis.layout.hasHero = !!document.querySelector(
					'[class*="hero"], [id*="hero"], header, .banner',
				);
				analysis.layout.hasNavigation = !!document.querySelector(
					'nav, [class*="nav"], [role="navigation"]',
				);
				analysis.layout.hasFooter = !!document.querySelector(
					'footer, [class*="footer"]',
				);

				// Check responsiveness
				const viewport = document.querySelector('meta[name="viewport"]');
				analysis.layout.responsive = !!viewport;

				// Performance issues
				const images = document.querySelectorAll("img");
				analysis.performance.imagesWithoutAlt = Array.from(images).filter(
					(img) => !img.alt,
				).length;

				const allElements = document.querySelectorAll("*");
				analysis.performance.missingTitles = Array.from(allElements).filter(
					(el) => el.hasAttribute("title") && !el.getAttribute("title"),
				).length;

				// Accessibility issues
				analysis.accessibility.missingAltText =
					analysis.performance.imagesWithoutAlt;

				// Check for small text
				const textElements = document.querySelectorAll("*");
				textElements.forEach((el) => {
					const style = window.getComputedStyle(el);
					const fontSize = parseFloat(style.fontSize);
					if (fontSize > 0 && fontSize < 14) {
						analysis.accessibility.smallText++;
					}
				});

				return analysis;
			});

			await page.close();

			const report = this.generateDesignReport(
				designAnalysis,
				url,
				compareWith,
			);

			return {
				content: [
					{
						type: "text",
						text: report,
					},
				],
			};
		} catch (error: any) {
			return {
				content: [
					{
						type: "text",
						text: `❌ Failed to analyze page design: ${error.message}`,
					},
				],
				isError: true,
			};
		}
	}

	async comparePages(args: any) {
		const { url1, url2, aspect = "design" } = args;

		try {
			await this.initBrowser();
			if (!this.browser) throw new Error("Browser not initialized");

			const [analysis1, analysis2] = await Promise.all([
				this.analyzeSinglePage(url1),
				this.analyzeSinglePage(url2),
			]);

			const comparison = this.generateComparisonReport(
				analysis1,
				analysis2,
				url1,
				url2,
				aspect,
			);

			return {
				content: [
					{
						type: "text",
						text: comparison,
					},
				],
			};
		} catch (error: any) {
			return {
				content: [
					{
						type: "text",
						text: `❌ Failed to compare pages: ${error.message}`,
					},
				],
				isError: true,
			};
		}
	}

	private async analyzeSinglePage(url: string) {
		const page = await this.browser?.newPage();
		await page.setViewport({ width: 1280, height: 720 });
		await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

		const analysis = await page.evaluate(() => ({
			title: document.title,
			headingsCount: document.querySelectorAll("h1, h2, h3").length,
			imagesCount: document.querySelectorAll("img").length,
			buttonsCount: document.querySelectorAll(
				'button, [role="button"], a[class*="btn"]',
			).length,
			formFieldsCount: document.querySelectorAll("input, textarea, select")
				.length,
			colorScheme: Array.from(
				new Set(
					Array.from(document.querySelectorAll("*"))
						.map((el) => {
							const style = window.getComputedStyle(el);
							return style.color;
						})
						.filter((color) => color && color !== "rgb(0, 0, 0)"),
				),
			).slice(0, 5),
			hasHero: !!document.querySelector('[class*="hero"], header, .banner'),
			hasCTA: !!document.querySelector(
				'[class*="cta"], [class*="call-to-action"], button, a[class*="btn"]',
			),
			mobileFriendly: !!document.querySelector('meta[name="viewport"]'),
		}));

		await page.close();
		return analysis;
	}

	private generateDesignReport(
		analysis: any,
		url: string,
		compareWith?: string,
	): string {
		let report = `# 🎨 Design Analysis: ${url}\n\n`;

		report += `## 📊 Page Overview\n`;
		report += `• **Title**: ${analysis.title}\n`;
		report += `• **Headings Structure**: ${analysis.headings.slice(0, 3).join(", ")}\n`;
		report += `• **Layout**: ${analysis.layout.hasHero ? "✅ Hero section" : "❌ No hero"} | ${analysis.layout.hasNavigation ? "✅ Navigation" : "❌ No navigation"} | ${analysis.layout.hasFooter ? "✅ Footer" : "❌ No footer"}\n\n`;

		report += `## 🎨 Visual Design\n`;
		report += `• **Color Palette**: ${analysis.colors.slice(0, 5).join(", ")}\n`;
		report += `• **Typography**: ${analysis.fonts.join(", ")}\n`;
		report += `• **Responsive**: ${analysis.layout.responsive ? "✅ Mobile-friendly" : "❌ Not responsive"}\n\n`;

		report += `## ⚡ Performance Issues\n`;
		report += `• Images without alt text: ${analysis.performance.imagesWithoutAlt}\n`;
		report += `• Missing titles: ${analysis.performance.missingTitles}\n\n`;

		report += `## ♿ Accessibility\n`;
		report += `• Images without alt text: ${analysis.accessibility.missingAltText}\n`;
		report += `• Small text elements: ${analysis.accessibility.smallText}\n\n`;

		if (compareWith) {
			report += `## 🔍 Comparison Requested\n`;
			report += `Compare with: ${compareWith}\n`;
			report += `💡 Use the \`puppeteer_compare_pages\` tool for detailed comparison.\n\n`;
		}

		report += `## 💡 Recommendations\n`;
		const recommendations = [];

		if (!analysis.layout.responsive)
			recommendations.push("• Add responsive design with viewport meta tag");
		if (analysis.performance.imagesWithoutAlt > 0)
			recommendations.push("• Add alt text to all images for accessibility");
		if (analysis.accessibility.smallText > 0)
			recommendations.push("• Increase font sizes for better readability");
		if (!analysis.layout.hasHero)
			recommendations.push(
				"• Consider adding a hero section for better first impression",
			);

		report +=
			recommendations.length > 0
				? recommendations.join("\n")
				: "• Overall design looks good! 🎉";

		return report;
	}

	private generateComparisonReport(
		analysis1: any,
		analysis2: any,
		url1: string,
		url2: string,
		aspect: string,
	): string {
		let report = `# 🔍 Page Comparison: ${aspect.toUpperCase()}\n\n`;
		report += `**${url1}** vs **${url2}**\n\n`;

		const comparisons = [
			{ label: "Page Title", val1: analysis1.title, val2: analysis2.title },
			{
				label: "Headings Count",
				val1: analysis1.headingsCount,
				val2: analysis2.headingsCount,
			},
			{
				label: "Images Count",
				val1: analysis1.imagesCount,
				val2: analysis2.imagesCount,
			},
			{
				label: "Buttons/CTAs",
				val1: analysis1.buttonsCount,
				val2: analysis2.buttonsCount,
			},
			{
				label: "Form Fields",
				val1: analysis1.formFieldsCount,
				val2: analysis2.formFieldsCount,
			},
			{
				label: "Hero Section",
				val1: analysis1.hasHero ? "✅" : "❌",
				val2: analysis2.hasHero ? "✅" : "❌",
			},
			{
				label: "Call-to-Action",
				val1: analysis1.hasCTA ? "✅" : "❌",
				val2: analysis2.hasCTA ? "✅" : "❌",
			},
			{
				label: "Mobile Friendly",
				val1: analysis1.mobileFriendly ? "✅" : "❌",
				val2: analysis2.mobileFriendly ? "✅" : "❌",
			},
		];

		comparisons.forEach((comp) => {
			const better = this.compareValues(comp.val1, comp.val2);
			report += `• **${comp.label}**: ${comp.val1} vs ${comp.val2} ${better}\n`;
		});

		report += `\n## 🎨 Color Schemes\n`;
		report += `**${url1}**: ${analysis1.colorScheme.join(", ")}\n`;
		report += `**${url2}**: ${analysis2.colorScheme.join(", ")}\n\n`;

		report += `## 💡 Insights\n`;
		const insights = this.generateComparisonInsights(
			analysis1,
			analysis2,
			url1,
			url2,
		);
		report += insights;

		return report;
	}

	private compareValues(val1: any, val2: any): string {
		if (typeof val1 === "number" && typeof val2 === "number") {
			if (val1 > val2) return "(↑ first better)";
			if (val1 < val2) return "(↑ second better)";
		}
		if (typeof val1 === "boolean" && typeof val2 === "boolean") {
			if (val1 && !val2) return "(✅ first has it)";
			if (!val1 && val2) return "(✅ second has it)";
		}
		return "";
	}

	private generateComparisonInsights(
		analysis1: any,
		analysis2: any,
		url1: string,
		url2: string,
	): string {
		const insights = [];

		if (analysis1.headingsCount > analysis2.headingsCount) {
			insights.push(
				`• ${url1} has better content structure with more headings`,
			);
		} else if (analysis2.headingsCount > analysis1.headingsCount) {
			insights.push(`• ${url2} has better content hierarchy`);
		}

		if (analysis1.hasCTA && !analysis2.hasCTA) {
			insights.push(`• ${url1} has clear call-to-action elements`);
		} else if (analysis2.hasCTA && !analysis1.hasCTA) {
			insights.push(`• ${url2} has better conversion elements`);
		}

		if (analysis1.mobileFriendly && !analysis2.mobileFriendly) {
			insights.push(`• ${url1} is mobile-optimized`);
		}

		if (insights.length === 0) {
			insights.push("• Both pages have similar design approaches");
		}

		return insights.join("\n");
	}

	async close(): Promise<void> {
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
		}
	}
}
