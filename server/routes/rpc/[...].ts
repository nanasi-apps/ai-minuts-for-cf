import { RPCHandler } from "@orpc/server/node";
import { router } from "@/server/orpc";
import { createPrismaClient } from "@/server/prisma-client";

const handler = new RPCHandler(router);

export default defineEventHandler(async (event) => {
	// Get D1 binding from Cloudflare context
	const { cloudflare } = event.context;
	const d1 = cloudflare?.env?.DB as D1Database;
	const ai = cloudflare?.env?.AI as Ai;

	if (!d1) {
		setResponseStatus(event, 500, "Database not configured");
		return "Database binding (DB) not found in Cloudflare environment";
	}

	// Create Prisma client with D1 adapter for this request
	const prisma = createPrismaClient(d1);

	const { matched } = await handler.handle(event.node.req, event.node.res, {
		prefix: "/rpc",
		context: {
			db: prisma,
			ai: ai,
		},
	});

	if (matched) {
		return;
	}

	setResponseStatus(event, 404, "Not Found");
	return "Not found";
});
