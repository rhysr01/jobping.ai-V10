export class BraveSearchMCP {
	private apiKey: string;
	private baseUrl = "https://api.search.brave.com/res/v1/web/search";

	constructor() {
		this.apiKey = process.env.BRAVE_API_KEY || "";
		if (!this.apiKey) {
			console.warn(
				"⚠️  BraveSearch MCP: BRAVE_API_KEY not set. BraveSearch tools will not be available.",
			);
		}
	}

	async webSearch(args: any) {
		if (!this.apiKey) {
			return {
				content: [
					{
						type: "text",
						text: "⚠️  BraveSearch MCP not configured. Please set BRAVE_API_KEY environment variable.",
					},
				],
			};
		}

		const { query, count = 10, safesearch = "moderate" } = args;

		try {
			const url = new URL(this.baseUrl);
			url.searchParams.set("q", query);
			url.searchParams.set("count", count.toString());
			url.searchParams.set("safesearch", safesearch);

			const response = await fetch(url.toString(), {
				headers: {
					Accept: "application/json",
					"Accept-Encoding": "gzip",
					"X-Subscription-Token": this.apiKey,
				},
			});

			if (!response.ok) {
				throw new Error(
					`BraveSearch API error: ${response.status} ${response.statusText}`,
				);
			}

			const data = await response.json();

			const results = data.web?.results || [];
			const formattedResults = results.map((result: any, index: number) => ({
				rank: index + 1,
				title: result.title,
				url: result.url,
				description: result.description,
				domain: new URL(result.url).hostname,
			}));

			return {
				content: [
					{
						type: "text",
						text: `🔍 BraveSearch Results for "${query}" (${formattedResults.length} results):\n\n${formattedResults
							.map(
								(result: any) =>
									`${result.rank}. **${result.title}**\n   📄 ${result.description}\n   🔗 ${result.url} (${result.domain})\n`,
							)
							.join("\n")}`,
					},
				],
			};
		} catch (error: any) {
			return {
				content: [
					{
						type: "text",
						text: `❌ Failed to search with BraveSearch: ${error.message}`,
					},
				],
				isError: true,
			};
		}
	}

	async researchTopic(args: any) {
		if (!this.apiKey) {
			return {
				content: [
					{
						type: "text",
						text: "⚠️  BraveSearch MCP not configured. Please set BRAVE_API_KEY environment variable.",
					},
				],
			};
		}

		const { topic, include_stats = true, count = 15 } = args;

		try {
			// Search for the main topic
			const mainSearch = await this.webSearch({
				query: topic,
				count,
				safesearch: "strict",
			});

			if (include_stats) {
				// Search for related statistics/data
				const statsQuery = `${topic} statistics 2024`;
				const statsSearch = await this.webSearch({
					query: statsQuery,
					count: 5,
					safesearch: "strict",
				});

				return {
					content: [
						{
							type: "text",
							text: `📊 Research Report: "${topic}"\n\n${mainSearch.content[0].text}\n\n📈 Related Statistics:\n${statsSearch.content[0].text}`,
						},
					],
				};
			}

			return mainSearch;
		} catch (error: any) {
			return {
				content: [
					{
						type: "text",
						text: `❌ Failed to research topic: ${error.message}`,
					},
				],
				isError: true,
			};
		}
	}

	async findSolutions(args: any) {
		if (!this.apiKey) {
			return {
				content: [
					{
						type: "text",
						text: "⚠️  BraveSearch MCP not configured. Please set BRAVE_API_KEY environment variable.",
					},
				],
			};
		}

		const { problem, technology = "", count = 10 } = args;

		try {
			const query = `${problem} ${technology} solution fix`.trim();
			const searchResults = await this.webSearch({
				query,
				count,
				safesearch: "moderate",
			});

			return {
				content: [
					{
						type: "text",
						text: `🛠️ Solutions for: "${problem}"${technology ? ` (${technology})` : ""}\n\n${searchResults.content[0].text}`,
					},
				],
			};
		} catch (error: any) {
			return {
				content: [
					{
						type: "text",
						text: `❌ Failed to find solutions: ${error.message}`,
					},
				],
				isError: true,
			};
		}
	}

	async techDocumentation(args: any) {
		if (!this.apiKey) {
			return {
				content: [
					{
						type: "text",
						text: "⚠️  BraveSearch MCP not configured. Please set BRAVE_API_KEY environment variable.",
					},
				],
			};
		}

		const { technology, topic, count = 8 } = args;

		try {
			const query = `${technology} ${topic} documentation official docs`;
			const searchResults = await this.webSearch({
				query,
				count,
				safesearch: "strict",
			});

			return {
				content: [
					{
						type: "text",
						text: `📚 ${technology} Documentation: "${topic}"\n\n${searchResults.content[0].text}`,
					},
				],
			};
		} catch (error: any) {
			return {
				content: [
					{
						type: "text",
						text: `❌ Failed to find documentation: ${error.message}`,
					},
				],
				isError: true,
			};
		}
	}
}
