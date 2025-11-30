/**
 * ユーザーパッキングサービス
 * DBから取得したユーザーエンティティをAPIレスポンス形式に変換する
 * Date型のシリアライズやnull値の処理を統一的に行う
 */

import type { MinutesLanguage } from "#/orpc/contracts/users";

/**
 * DBから取得したユーザーエンティティの型
 */

export interface UserEntity {
	id: number;
	email: string;
	name: string | null;
	avatarUrl: string | null;
	bio: string | null;
	summaryPreference: string;
	minutesLanguage: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * APIレスポンス用のユーザー型
 * Date型はISO8601文字列に変換される
 */
export interface PackedUser {
	id: number;
	email: string;
	name: string | null;
	avatarUrl: string | null;
	bio: string | null;
	summaryPreference: string;
	minutesLanguage: MinutesLanguage;
	createdAt: string;
	updatedAt: string;
}

export const normalizeMinutesLanguage = (language: string): MinutesLanguage => {
	return language === "en" ? "en" : "ja";
};

/**
 * ユーザーパッキングサービス
 * ユーザーエンティティのAPIレスポンス変換を担当
 */
export class UserPackingService {
	/**
	 * 単一のユーザーエンティティをAPIレスポンス形式に変換する
	 * @param user - DBから取得したユーザーエンティティ
	 * @returns APIレスポンス用のユーザーオブジェクト
	 */
	pack(user: UserEntity): PackedUser {
		return {
			id: user.id,
			email: user.email,
			name: user.name,
			avatarUrl: user.avatarUrl,
			bio: user.bio,
			summaryPreference: user.summaryPreference,
			minutesLanguage: normalizeMinutesLanguage(user.minutesLanguage),
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
		};
	}

	/**
	 * 複数のユーザーエンティティをAPIレスポンス形式に変換する
	 * @param users - DBから取得したユーザーエンティティの配列
	 * @returns APIレスポンス用のユーザーオブジェクトの配列
	 */
	packMany(users: UserEntity[]): PackedUser[] {
		return users.map((user) => this.pack(user));
	}
}

/**
 * シングルトンインスタンス
 * サービス層で共通して使用する
 */
export const userPackingService = new UserPackingService();
