import { ORPCError, os } from "@orpc/server";

/**
 * JWTペイロードの型定義
 * Google/GitHub OAuth認証で使用するクレーム
 */
export interface JWTPayload {
	/** ユーザーID（DBのUser.id） */
	sub: number;
	/** トークン発行時刻（Unix timestamp） */
	iat: number;
	/** トークン有効期限（Unix timestamp） */
	exp: number;
}

/**
 * JWTヘッダーの型定義
 */
interface JWTHeader {
	alg: string;
	typ: string;
}

/**
 * Base64URL文字列をUint8Arrayにデコードする
 * @param base64url - Base64URLエンコードされた文字列
 * @returns デコードされたバイト配列
 */
function base64UrlToUint8Array(base64url: string): Uint8Array {
	const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
	const paddedBase64 = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
	const binaryString = atob(paddedBase64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

/**
 * Uint8ArrayをBase64URL文字列にエンコードする
 * @param bytes - エンコードするバイト配列
 * @returns Base64URLエンコードされた文字列
 */
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i] as number);
	}
	const base64 = btoa(binary);
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * HMAC-SHA256署名用の暗号鍵をインポートする
 * @param secret - JWT署名用の秘密鍵文字列
 * @returns Web Crypto API のCryptoKeyオブジェクト
 */
async function importKey(secret: string): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	return await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
}

/**
 * HMAC-SHA256署名を生成する
 * @param key - 署名用の暗号鍵
 * @param data - 署名対象のデータ
 * @returns 署名のバイト配列
 */
async function sign(key: CryptoKey, data: string): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
	return new Uint8Array(signature);
}

/**
 * HMAC-SHA256署名を検証する
 * @param key - 検証用の暗号鍵
 * @param signature - 検証対象の署名
 * @param data - 署名対象のデータ
 * @returns 署名が有効な場合はtrue
 */
async function verify(
	key: CryptoKey,
	signature: Uint8Array,
	data: string,
): Promise<boolean> {
	const encoder = new TextEncoder();
	return await crypto.subtle.verify(
		"HMAC",
		key,
		signature.buffer as ArrayBuffer,
		encoder.encode(data),
	);
}

/**
 * JWTトークンをデコード・検証するユーティリティ関数
 * Cloudflare Workers 環境で Web Crypto API を使用してHMAC-SHA256署名を検証する
 *
 * @param token - Authorization ヘッダーから取得したBearerトークン
 * @param secret - JWT署名検証用の秘密鍵
 * @returns デコードされたペイロード、または検証失敗時はnull
 */
async function verifyJWT(
	token: string,
	secret: string,
): Promise<JWTPayload | null> {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) {
			return null;
		}

		const [headerBase64, payloadBase64, signatureBase64] = parts as [
			string,
			string,
			string,
		];

		// ヘッダーをデコードしてアルゴリズムを確認
		const headerJson = atob(headerBase64.replace(/-/g, "+").replace(/_/g, "/"));
		const header = JSON.parse(headerJson) as JWTHeader;

		// HS256アルゴリズムのみをサポート
		if (header.alg !== "HS256") {
			return null;
		}

		// 署名検証用の暗号鍵をインポート
		const key = await importKey(secret);

		// 署名対象のデータ（header.payload）
		const signatureInput = `${headerBase64}.${payloadBase64}`;

		// 署名をBase64URLからバイト配列にデコード
		const signature = base64UrlToUint8Array(signatureBase64);

		// 署名を検証
		const isValid = await verify(key, signature, signatureInput);
		if (!isValid) {
			return null;
		}

		// ペイロードをデコード
		const payloadJson = atob(
			payloadBase64.replace(/-/g, "+").replace(/_/g, "/"),
		);
		const payload = JSON.parse(payloadJson) as JWTPayload;

		// 有効期限チェック
		const now = Math.floor(Date.now() / 1000);
		if (payload.exp && payload.exp < now) {
			return null;
		}

		// 発行時刻が未来でないことを確認（時刻ずれを考慮して5分の余裕を持たせる）
		if (payload.iat && payload.iat > now + 300) {
			return null;
		}

		return payload;
	} catch {
		return null;
	}
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
	const payload = await verifyJWT(token, jwtSecret);

	if (!payload) {
		throw new ORPCError("UNAUTHORIZED", {
			message: "無効または期限切れのトークンです",
		});
	}

	// 認証成功: userId をコンテキストに追加
	return next({
		context: {
			userId: payload.sub,
		},
	});
});

/**
 * JWT生成ユーティリティ
 * OAuth認証フロー完了時にユーザーIDからJWTトークンを生成する
 * HMAC-SHA256アルゴリズムで署名を行う
 *
 * @param userId - DBのUser.id
 * @param secret - JWT署名用の秘密鍵
 * @param expiresInSeconds - トークン有効期間（秒）、デフォルト24時間
 * @returns 署名済みJWTトークン文字列
 */
export async function generateJWT(
	userId: number,
	secret: string,
	expiresInSeconds = 60 * 60 * 24, // 24時間
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);

	const header = {
		alg: "HS256",
		typ: "JWT",
	};

	const payload: JWTPayload = {
		sub: userId,
		iat: now,
		exp: now + expiresInSeconds,
	};

	// Base64URL エンコード
	const encodeBase64Url = (obj: object): string => {
		const json = JSON.stringify(obj);
		const base64 = btoa(json);
		return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	};

	const headerEncoded = encodeBase64Url(header);
	const payloadEncoded = encodeBase64Url(payload);

	// 署名対象のデータ
	const signatureInput = `${headerEncoded}.${payloadEncoded}`;

	// HMAC-SHA256で署名を生成
	const key = await importKey(secret);
	const signatureBytes = await sign(key, signatureInput);
	const signatureEncoded = uint8ArrayToBase64Url(signatureBytes);

	return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
}
