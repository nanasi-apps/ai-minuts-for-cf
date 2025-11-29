/// <reference types="./worker-configuration.d.ts" />

import type { H3Event as _H3Event } from "h3";

declare global {
	type H3Event = _H3Event;
}

declare module "h3" {
	interface H3EventContext {
		cf: CfProperties;
		cloudflare: {
			request: Request;
			env: Env;
			context: ExecutionContext;
		};
	}
}

export { };
