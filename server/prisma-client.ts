import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@/server/prisma-client/client";

/**
 * Create a PrismaClient instance with D1 adapter for Cloudflare Workers.
 * This function should be called for each request with the D1 binding from the event context.
 * @param d1 - D1Database binding from Cloudflare Workers environment (env.DB)
 */
export function createPrismaClient(d1: D1Database): PrismaClient {
	const adapter = new PrismaD1(d1);
	return new PrismaClient({ adapter });
}
