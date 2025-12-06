import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
	});

	async init() {
		// Simple addition tool
		this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}));

		// Calculator tool with multiple operations
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			},
		);
		// Square Root tool
        this.server.tool(
            "squareRoot", 
            { n: z.number() }, 
            async ({ n }) => {
                if (n < 0) {
                    return { 
                        content: [{ 
                            type: "text", 
                            text: "Error: Cannot take the square root of a negative number" 
                        }] 
                    };
                }
                const result = Math.sqrt(n);
                return { content: [{ type: "text", text: String(result) }] };
            }
        );

        // Power (Exponentiation) tool
        this.server.tool(
            "power", 
            { base: z.number(), exponent: z.number() }, 
            async ({ base, exponent }) => {
                const result = Math.pow(base, exponent);
                return { content: [{ type: "text", text: String(result) }] };
            }
        );

        // Fibonacci value by index tool (0-indexed: F(0)=0, F(1)=1, F(2)=1, F(3)=2, F(4)=3, ...)
        this.server.tool(
            "fibonacci", 
            { index: z.number().int().min(0) }, 
            async ({ index }) => {
                if (index < 0) {
                    return { 
                        content: [{ 
                            type: "text", 
                            text: "Error: Fibonacci index must be a non-negative integer" 
                        }] 
                    };
                }
                
                // Iterative calculation for performance and simplicity
                let a = 0;
                let b = 1;
                if (index === 0) return { content: [{ type: "text", text: "0" }] };
                
                for (let i = 2; i <= index; i++) {
                    const temp = a + b;
                    a = b;
                    b = temp;
                }
                
                return { content: [{ type: "text", text: String(b) }] };
            }
        );
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
