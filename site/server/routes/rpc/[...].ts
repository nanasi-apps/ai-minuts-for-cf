import { RPCHandler } from "@orpc/server/fetch";
import { router } from "@/server/orpc";
import { createPrismaClient } from "@/server/prisma-client";

const handler = new RPCHandler(router);

export default defineEventHandler(async (event) => {
	// Get D1 binding from Cloudflare context
	const { cloudflare } = event.context;
	const d1 = cloudflare?.env?.ai_minuts as D1Database;
	const ai = cloudflare?.env?.AI as Ai;
	const r2 = cloudflare?.env?.minuts_videos as R2Bucket;
	// JWT署名・検証用の秘密鍵（wrangler secret で設定）
	const jwtSecret =
		(cloudflare?.env?.JWT_SECRET as string | undefined) ||
		process.env.JWT_SECRET;

	if (!d1) {
		setResponseStatus(event, 500, "Database not configured");
		return "Database binding (ai_minuts) not found in Cloudflare environment";
	}

	// Create Prisma client with D1 adapter for this request
	const prisma = createPrismaClient(d1);

	// 認証ヘッダーを取得してコンテキストに含める
	const authHeader = getHeader(event, "authorization");

	const { matched, response } = await handler.handle(toWebRequest(event), {
		prefix: "/rpc",
		context: {
			db: prisma,
			ai: ai,
			r2: r2,
			authHeader: authHeader,
			jwtSecret: jwtSecret,
			event: event,
		},
	});

	if (matched) {
		return response;
	}

	setResponseStatus(event, 404, "Not Found");
	return "Not found";
});
