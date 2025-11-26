/// <reference types="./worker-configuration.d.ts" />

declare module "h3" {
	interface H3EventContext {
		cf: CfProperties;
		cloudflare: {
			request: Request;
			env: {
				DB: D1Database;
			};
			context: ExecutionContext;
		};
	}
}

export {};
