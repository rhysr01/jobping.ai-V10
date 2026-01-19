import { chromium } from "playwright";

export class PlaywrightMCP {
	private async createBrowser() {
		return await chromium.launch({
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

	private async createContext(
		browser: any,
		viewport = { width: 1280, height: 720 },
	) {
		return await browser.newContext({ viewport });
	}

	async takeScreenshot(args: any) {
		const {
			url,
			viewport = { width: 1280, height: 720 },
			fullPage = false,
			selector,
		} = args;

		let browser: any = null;
		let context: any = null;
		let page: any = null;

		try {
			browser = await this.createBrowser();
			context = await this.createContext(browser, viewport);
			page = await context.newPage();

			await page.goto(url, { waitUntil: "load", timeout: 30000 });

			let screenshotBuffer: Buffer;

			if (selector) {
				// Take screenshot of specific element
				await page.waitForSelector(selector);
				const element = page.locator(selector);
				screenshotBuffer = await element.screenshot({ type: "png" });
			} else {
				// Take full page or viewport screenshot
				screenshotBuffer = await page.screenshot({
					fullPage,
					type: "png",
				});
			}

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
		} finally {
			if (page) await page.close();
			if (context) await context.close();
			if (browser) await browser.close();
		}
	}

	async analyzePageDesign(args: any) {
		const { url } = args;

		let browser: any = null;
		let context: any = null;
		let page: any = null;

		try {
			browser = await this.createBrowser();
			context = await this.createContext(browser);
			page = await context.newPage();

			await page.goto(url, { waitUntil: "load", timeout: 30000 });

			// Analyze page design elements
			const designAnalysis = await page.evaluate(() => {
				const stylesheets = Array.from(document.styleSheets).length;
				const scripts = document.querySelectorAll("script").length;
				const images = document.querySelectorAll("img").length;
				const links = document.querySelectorAll("a").length;
				const forms = document.querySelectorAll("form").length;
				const headings = document.querySelectorAll(
					"h1, h2, h3, h4, h5, h6",
				).length;

				// Get color palette
				const colors = new Set<string>();
				const elements = document.querySelectorAll("*");
				elements.forEach((el) => {
					const style = window.getComputedStyle(el);
					colors.add(style.backgroundColor);
					colors.add(style.color);
					colors.add(style.borderColor);
				});

				// Get font families
				const fonts = new Set<string>();
				elements.forEach((el) => {
					const style = window.getComputedStyle(el);
					fonts.add(style.fontFamily);
				});

				return {
					title: document.title,
					stylesheets,
					scripts,
					images,
					links,
					forms,
					headings,
					colorCount: colors.size,
					fontCount: fonts.size,
					totalElements: elements.length,
					viewport: {
						width: window.innerWidth,
						height: window.innerHeight,
					},
				};
			});

			return {
				content: [
					{
						type: "text",
						text: `🎨 Design Analysis for ${url}:\n\n📄 Page Info:\n• Title: ${designAnalysis.title}\n• Viewport: ${designAnalysis.viewport.width}x${designAnalysis.viewport.height}\n\n📊 Elements:\n• Total elements: ${designAnalysis.totalElements}\n• Images: ${designAnalysis.images}\n• Links: ${designAnalysis.links}\n• Forms: ${designAnalysis.forms}\n• Headings: ${designAnalysis.headings}\n\n🎨 Styling:\n• Stylesheets: ${designAnalysis.stylesheets}\n• Scripts: ${designAnalysis.scripts}\n• Unique colors: ${designAnalysis.colorCount}\n• Font families: ${designAnalysis.fontCount}`,
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
		} finally {
			if (page) await page.close();
			if (context) await context.close();
			if (browser) await browser.close();
		}
	}

	async runTestScenario(args: any) {
		const { url, actions = [] } = args;

		let browser: any = null;
		let context: any = null;
		let page: any = null;

		try {
			browser = await this.createBrowser();
			context = await this.createContext(browser);
			page = await context.newPage();

			await page.goto(url, { waitUntil: "load", timeout: 30000 });

			const results: string[] = [];
			results.push(`🚀 Starting test scenario on ${url}`);

			// Execute actions
			for (const action of actions) {
				try {
					switch (action.type) {
						case "click":
							await page.click(action.selector, { timeout: 10000 });
							results.push(`✅ Clicked: ${action.selector}`);
							break;

						case "type":
							await page.fill(action.selector, action.text);
							results.push(
								`✅ Typed "${action.text}" into: ${action.selector}`,
							);
							break;

						case "wait":
							await page.waitForTimeout(action.ms || 1000);
							results.push(`⏳ Waited ${action.ms || 1000}ms`);
							break;

						case "waitForSelector":
							await page.waitForSelector(action.selector, {
								timeout: action.timeout || 10000,
							});
							results.push(`✅ Found element: ${action.selector}`);
							break;

						case "assert": {
							const element = await page.locator(action.selector);
							const isVisible = await element.isVisible();
							if (action.expected === "visible" && isVisible) {
								results.push(
									`✅ Assertion passed: ${action.selector} is visible`,
								);
							} else if (action.expected === "hidden" && !isVisible) {
								results.push(
									`✅ Assertion passed: ${action.selector} is hidden`,
								);
							} else {
								results.push(
									`❌ Assertion failed: ${action.selector} visibility expected ${action.expected}, got ${isVisible ? "visible" : "hidden"}`,
								);
							}
							break;
						}

						default:
							results.push(`⚠️ Unknown action type: ${action.type}`);
					}
				} catch (actionError: any) {
					results.push(
						`❌ Action failed (${action.type}): ${actionError.message}`,
					);
				}
			}

			// Take final screenshot
			const screenshotBuffer = await page.screenshot({ type: "png" });
			const base64Image = screenshotBuffer.toString("base64");

			return {
				content: [
					{
						type: "text",
						text: `📋 Test Scenario Results:\n\n${results.join("\n")}\n\n📸 Final screenshot:`,
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
						text: `❌ Failed to run test scenario: ${error.message}`,
					},
				],
				isError: true,
			};
		} finally {
			if (page) await page.close();
			if (context) await context.close();
			if (browser) await browser.close();
		}
	}

	async comparePages(args: any) {
		const { url1, url2 } = args;

		let browser1: any = null;
		let browser2: any = null;
		let context1: any = null;
		let context2: any = null;
		let page1: any = null;
		let page2: any = null;

		try {
			// Take screenshot of first page
			browser1 = await this.createBrowser();
			context1 = await this.createContext(browser1);
			page1 = await context1.newPage();
			await page1.goto(url1, { waitUntil: "networkidle", timeout: 30000 });
			const screenshot1 = await page1.screenshot({ type: "png" });
			await page1.close();
			await context1.close();
			await browser1.close();

			// Take screenshot of second page
			browser2 = await this.createBrowser();
			context2 = await this.createContext(browser2);
			page2 = await context2.newPage();
			await page2.goto(url2, { waitUntil: "networkidle", timeout: 30000 });
			const screenshot2 = await page2.screenshot({ type: "png" });
			await page2.close();
			await context2.close();
			await browser2.close();

			const base64Image1 = screenshot1.toString("base64");
			const base64Image2 = screenshot2.toString("base64");

			return {
				content: [
					{
						type: "text",
						text: `🔍 Page Comparison:\n\n📄 Page 1: ${url1}\n📄 Page 2: ${url2}\n\n📸 Screenshots taken for visual comparison.`,
					},
					{
						type: "image",
						data: base64Image1,
						mimeType: "image/png",
					},
					{
						type: "image",
						data: base64Image2,
						mimeType: "image/png",
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

	async cleanup(): Promise<void> {
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
		}
	}
}
