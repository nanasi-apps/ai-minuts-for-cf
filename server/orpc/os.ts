import { implement } from "@orpc/server";
import { contract } from "#/orpc";
import { dbProviderMiddleware } from "@/server/middlewares/db";
import type { PrismaClient } from "@/server/prisma-client/client";

/**
 * 基本のoRPCコンテキスト型
 * すべてのハンドラーで利用可能な共通コンテキスト
 */
export interface ORPCContext {
	db: PrismaClient;
	ai: Ai;
	/** 認証ヘッダー（Authorization: Bearer xxx） */
	authHeader?: string;
	/** JWT署名・検証用の秘密鍵（環境変数 JWT_SECRET から取得） */
	jwtSecret?: string;
	/** H3 Event object for accessing cookies etc. */
	event: any;
}

/**
 * 認証済みコンテキスト型
 * JWT認証ミドルウェア適用後に利用可能
 * userId が必ず存在することを型レベルで保証
 */
export interface AuthenticatedORPCContext extends ORPCContext {
	userId: number;
}

const baseOS = implement(contract);

export const os = baseOS.$context<ORPCContext>().use(dbProviderMiddleware);
