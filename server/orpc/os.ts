import { implement } from "@orpc/server";
import { contract } from "#/orpc";
import { dbProviderMiddleware } from "@/server/middlewares/db";
import type { PrismaClient } from "@/server/prisma-client/client";

export interface ORPCContext {
	db: PrismaClient;
}

const baseOS = implement(contract);

export const os = baseOS.$context<ORPCContext>().use(dbProviderMiddleware);
