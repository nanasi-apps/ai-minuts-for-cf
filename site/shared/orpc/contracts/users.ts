import { oc } from "@orpc/contract";
import * as z from "zod";

/**
 * ユーザー情報のスキーマ定義
 * API レスポンスで返すユーザー情報の形式を定義
 */
const userSchema = z.object({
	id: z.number(),
	email: z.email(),
	name: z.string().nullable(),
	avatarUrl: z.string().url().nullable(),
	bio: z.string().nullable(),
	createdAt: z.string(), // ISO8601形式の日時文字列（JSON シリアライズ対応）
	updatedAt: z.string(),
});

/**
 * プロフィール更新時の入力スキーマ
 * 更新可能なフィールドのみを定義（部分更新をサポート）
 */
const updateProfileInputSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	avatarUrl: z.url().optional(),
	bio: z.string().max(500).optional(),
});

/**
 * ユーザー取得エンドポイント
 * 認証済みユーザーの情報を取得する
 * JWTトークンから userId を取得してユーザー情報を返す
 */
const getMe = oc
	.route({
		path: "/me",
		method: "GET",
	})
	.output(userSchema);

/**
 * ユーザーID指定での取得エンドポイント
 * 指定されたIDのユーザー情報を取得する（公開情報のみ）
 */
const getUser = oc
	.route({
		path: "/{id}",
		method: "GET",
	})
	.input(
		z.object({
			id: z.coerce.number(),
		}),
	)
	.output(userSchema);

/**
 * プロフィール更新エンドポイント
 * 認証済みユーザーが自身のプロフィールを更新する
 * JWTトークンから userId を取得して更新対象を特定
 */
const updateProfile = oc
	.route({
		path: "/me",
		method: "PATCH",
	})
	.input(updateProfileInputSchema)
	.output(userSchema);

/**
 * users コントラクトルーター
 * /users プレフィックス配下にエンドポイントを配置
 */
export default oc.prefix("/users").router({
	getMe,
	getUser,
	updateProfile,
});

/**
 * スキーマの再エクスポート（サーバー実装で型として使用）
 */
export { userSchema, updateProfileInputSchema };
