import { ORPCError } from "@orpc/server";
import { authMiddleware } from "@/server/middlewares/auth";
import { os } from "@/server/orpc/os";
import {
	normalizeMinutesLanguage,
	type UserEntity,
	userPackingService,
} from "@/server/service/UserPackingService";

/**
 * ユーザー関連のハンドラー実装
 * コントラクトで定義されたエンドポイントに対応するサーバー側処理
 */
export default {
	/**
	 * 認証済みユーザーの情報を取得
	 * JWTミドルウェアで設定された userId を使用してDBからユーザー情報を取得
	 */
	getMe: os.users.getMe.use(authMiddleware).handler(async ({ context }) => {
		// context.userId は JWT認証ミドルウェアで設定される
		const userId = context.userId;

		const user = (await context.db.user.findUnique({
			where: { id: userId },
		})) as UserEntity | null;

		// ユーザーが見つからない場合（通常は発生しないが、削除済みの場合など）
		if (!user) {
			throw new ORPCError("NOT_FOUND", {
				message: "ユーザーが見つかりません",
			});
		}

		return userPackingService.pack(user);
	}),

	/**
	 * 指定IDのユーザー情報を取得
	 * 公開プロフィールとして他のユーザーからも参照可能
	 * 認証は不要
	 */
	getUser: os.users.getUser.handler(async ({ input, context }) => {
		const user = (await context.db.user.findUnique({
			where: { id: input.id },
		})) as UserEntity | null;

		if (!user) {
			throw new ORPCError("NOT_FOUND", {
				message: "ユーザーが見つかりません",
			});
		}

		return userPackingService.pack(user);
	}),

	/**
	 * 認証済みユーザーのプロフィールを更新
	 * 部分更新をサポート（指定されたフィールドのみ更新）
	 */
	updateProfile: os.users.updateProfile
		.use(authMiddleware)
		.handler(async ({ input, context }) => {
			const userId = context.userId;

			// 更新対象のユーザーが存在するか確認
			const existingUser = (await context.db.user.findUnique({
				where: { id: userId },
			})) as UserEntity | null;

			if (!existingUser) {
				throw new ORPCError("NOT_FOUND", {
					message: "ユーザーが見つかりません",
				});
			}

			// 入力されたフィールドのみを更新データとして構築
			// undefined のフィールドは Prisma の update で無視される
			const updateData: {
				name?: string;
				avatarUrl?: string;
				bio?: string;
			} = {};

			if (input.name !== undefined) {
				updateData.name = input.name;
			}
			if (input.avatarUrl !== undefined) {
				updateData.avatarUrl = input.avatarUrl;
			}
			if (input.bio !== undefined) {
				updateData.bio = input.bio;
			}

			const updatedUser = (await context.db.user.update({
				where: { id: userId },
				data: updateData,
			})) as UserEntity;

			return userPackingService.pack(updatedUser);
		}),

	/**
	 * 認証済みユーザーの設定を取得
	 */
	getSettings: os.users.getSettings
		.use(authMiddleware)
		.handler(async ({ context }) => {
			const userId = context.userId;

			const user = (await context.db.user.findUnique({
				where: { id: userId },
			})) as UserEntity | null;

			if (!user) {
				throw new ORPCError("NOT_FOUND", {
					message: "ユーザーが見つかりません",
				});
			}

			return {
				summaryPreference: user.summaryPreference,
				minutesLanguage: normalizeMinutesLanguage(user.minutesLanguage),
			};
		}),

	/**
	 * 認証済みユーザーの設定を更新
	 */
	updateSettings: os.users.updateSettings
		.use(authMiddleware)
		.handler(async ({ input, context }) => {
			const userId = context.userId;

			const updatedUser = (await context.db.user.update({
				where: { id: userId },
				data: {
					summaryPreference: input.summaryPreference,
					minutesLanguage: input.minutesLanguage,
				},
			})) as UserEntity;

			return {
				summaryPreference: updatedUser.summaryPreference,
				minutesLanguage: normalizeMinutesLanguage(updatedUser.minutesLanguage),
			};
		}),
};
