import { os } from "@orpc/server";
import type { PrismaClient } from "@/server/prisma-client/client";

export const dbProviderMiddleware = os
	.$context<{ db: PrismaClient }>()
	.middleware(async ({ context, next }) => {
		const db: PrismaClient = context.db;

		return next({
			context: {
				db,
			},
		});
	});
