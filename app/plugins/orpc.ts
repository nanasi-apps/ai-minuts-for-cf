import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "#/orpc";

export default defineNuxtPlugin((_nuxtApp) => {
	const requestURL = useRequestURL();

	// SSRとクライアントで適切なURLを構築
	const baseURL = import.meta.server
		? `${requestURL.protocol}//${requestURL.host}`
		: window.location.origin;

	const rpcLink = new RPCLink({
		url: new URL("/rpc", baseURL),
		headers: () => {
			let token: string | null = null;
			if (import.meta.client) {
				try {
					token = localStorage.getItem("access_token");
				} catch (error) {
					console.warn("Failed to access localStorage:", error);
				}
			}
			return token ? { Authorization: `Bearer ${token}` } : {};
		},
	});

	const apiClient: ContractRouterClient<typeof contract> =
		createORPCClient(rpcLink);

	return {
		provide: {
			api: apiClient,
		},
	};
});
