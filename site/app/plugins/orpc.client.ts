import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { RequestValidationPlugin } from "@orpc/contract/plugins";
import { contract } from "#/orpc";

export default defineNuxtPlugin(async () => {
	const baseURL = window.location.origin;

	const rpcLink = new RPCLink({
		url: new URL("/rpc", baseURL),
		plugins: [new RequestValidationPlugin(contract)],
		headers: () => {
			let token: string | null = null;
			try {
				token = localStorage.getItem("session_token");
			} catch (error) {
				console.warn("Failed to access localStorage:", error);
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
