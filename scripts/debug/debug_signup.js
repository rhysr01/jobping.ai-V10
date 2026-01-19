const { spawn } = require("node:child_process");

// Query recent users
const queryUsers = () => {
	return new Promise((resolve, reject) => {
		const child = spawn("tsx", ["scripts/mcps/mcp-server.ts"], {
			cwd: process.cwd(),
			stdio: ["pipe", "pipe", "pipe"],
		});

		let output = "";
		let errorOutput = "";

		child.stdout.on("data", (data) => {
			output += data.toString();
		});

		child.stderr.on("data", (data) => {
			errorOutput += data.toString();
		});

		// Wait for server to start
		setTimeout(() => {
			// Send query
			const query = `${JSON.stringify({
				jsonrpc: "2.0",
				id: 1,
				method: "tools/call",
				params: {
					name: "supabase_query_users",
					arguments: {
						limit: 10,
						offset: 0,
						filters: {
							orderBy: "created_at",
							orderDirection: "desc",
						},
					},
				},
			})}\n`;

			child.stdin.write(query);

			// Wait for response
			setTimeout(() => {
				child.kill();
				console.log("Recent users:");
				console.log(output);
				if (errorOutput) {
					console.log("Errors:", errorOutput);
				}
				resolve();
			}, 2000);
		}, 3000);

		child.on("error", reject);
	});
};

queryUsers().catch(console.error);
