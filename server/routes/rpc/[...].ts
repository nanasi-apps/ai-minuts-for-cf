import { RPCHandler } from "@orpc/server/node";
import { router } from "@/server/orpc";
import { createPrismaClient } from "@/server/prisma-client";

const handler = new RPCHandler(router);

export default defineEventHandler(async (event) => {
	// Get D1 binding from Cloudflare context
	const { cloudflare } = event.context;
	const d1 = cloudflare?.env?.DB as D1Database;
	const ai = cloudflare?.env?.AI as Ai;
	// JWT署名・検証用の秘密鍵（wrangler secret で設定）
	const jwtSecret = cloudflare?.env?.JWT_SECRET as string | undefined;

	if (!d1) {
		setResponseStatus(event, 500, "Database not configured");
		return "Database binding (DB) not found in Cloudflare environment";
	}

	// Create Prisma client with D1 adapter for this request
	const prisma = createPrismaClient(d1);

	// 認証ヘッダーを取得してコンテキストに含める
	const authHeader = getHeader(event, "authorization");

	const { matched } = await handler.handle(event.node.req, event.node.res, {
		prefix: "/rpc",
		context: {
			db: prisma,
			ai: ai,
			authHeader: authHeader,
			jwtSecret: jwtSecret,
		},
	});

	if (matched) {
		return;
	}

	setResponseStatus(event, 404, "Not Found");
	return "Not found";
});
