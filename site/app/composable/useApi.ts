import type { ContractRouterClient } from "@orpc/contract";
import type { AsyncDataOptions } from "nuxt/app";
import type { contract } from "#/orpc";

export const useApi = () => {
	const { $api } = useNuxtApp();
	return $api as ContractRouterClient<typeof contract>;
};

// useAsyncDataでラップしたAPIフェッチ用（キー自動生成）
export const useAsyncApi = <T>(
	fetcher: (api: ContractRouterClient<typeof contract>) => Promise<T>,
	options?: AsyncDataOptions<T> & { key?: string },
) => {
	const api = useApi();
	// キーが指定されていない場合は関数の文字列表現からハッシュを生成
	const key = options?.key ?? `api:${fetcher.toString().slice(0, 100)}`;
	return useAsyncData(key, () => fetcher(api), options);
};
