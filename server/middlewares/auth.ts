import { ORPCError, os } from "@orpc/server";
import { jwtVerify } from "jose";

/**
 * JWTペイロードの型定義
 */
export interface JWTPayload {
	userId: number;
}

/**
 * 認証済みコンテキストの型
 * authMiddleware 適用後に利用可能
 */
export interface AuthContext {
	userId: number;
}

/**
 * JWT認証ミドルウェア
 * Authorization ヘッダーからBearerトークンを取得し、検証する
 * 認証成功時は context.userId を設定
 * 認証失敗時は UNAUTHORIZED エラーをスロー
 *
 * 秘密鍵は環境変数 JWT_SECRET から取得される
 * Cloudflare Workers では wrangler secret で設定すること
 */
export const authMiddleware = os.middleware(async ({ context, next }) => {
	// context から認証ヘッダーと秘密鍵を取得
	const ctx = context as { authHeader?: string; jwtSecret?: string };
	const authHeader = ctx.authHeader;
	const jwtSecret = ctx.jwtSecret;

	if (!jwtSecret) {
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "JWT秘密鍵が設定されていません",
		});
	}

	if (!authHeader) {
		throw new ORPCError("UNAUTHORIZED", {
			message: "認証が必要です",
		});
	}

	// Bearer トークン形式の検証
	if (!authHeader.startsWith("Bearer ")) {
		throw new ORPCError("UNAUTHORIZED", {
			message: "無効な認証形式です",
		});
	}

	const token = authHeader.slice(7); // "Bearer " を除去

	try {
		const secret = new TextEncoder().encode(jwtSecret);
		const { payload } = await jwtVerify(token, secret);

		if (!payload.userId) {
			throw new Error("Invalid payload");
		}

		// 認証成功: userId をコンテキストに追加
		return next({
			context: {
				userId: Number(payload.userId),
			},
		});
	} catch (e) {
		throw new ORPCError("UNAUTHORIZED", {
			message: "無効または期限切れのトークンです",
		});
	}
});

