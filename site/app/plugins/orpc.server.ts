import type { ContractRouterClient } from "@orpc/contract";
import { createRouterClient } from "@orpc/server";
import type { contract } from "#/orpc";
import { router } from "@/server/orpc";
import { createPrismaClient } from "@/server/prisma-client";

export default defineNuxtPlugin(() => {
	const event = useRequestEvent();
	if (!event) {
		throw new Error("Event is missing in SSR context");
	}

	const apiClient: ContractRouterClient<typeof contract> = createRouterClient(
		router,
		{
			context: async () => {
				const { cloudflare } = event.context;
				const d1 = cloudflare?.env?.ai_minuts as D1Database;
				const ai = cloudflare?.env?.AI as Ai;
				const r2 = cloudflare?.env?.minuts_videos as R2Bucket;
				const jwtSecret =
					(cloudflare?.env?.JWT_SECRET as string) || process.env.JWT_SECRET;

				if (!d1) {
					console.error("Database binding (ai_minuts) not found");
					throw new Error("Database not configured");
				}

				const prisma = createPrismaClient(d1);
				const authHeader = getHeader(event, "authorization");

				return {
					db: prisma,
					ai,
					r2,
					authHeader,
					jwtSecret,
					event,
				};
			},
		},
	);
	return {
		provide: {
			apiClient,
		},
	};
});
