import type { InferContractRouterOutputs } from "@orpc/contract";
import { Store } from "@tanstack/vue-store";
import type { contract } from "#/orpc";

import { useAsyncApi } from "@/app/composable/useApi";

type Outputs = InferContractRouterOutputs<typeof contract>;
type User = NonNullable<Outputs["auth"]["me"]["user"]>;

interface AuthState {
	user: User | null;
	isLoading: boolean;
}

export const authStore = new Store<AuthState>({
	user: null,
	isLoading: true,
});

export const setUser = (user: User | null) => {
	authStore.setState((state) => {
		return {
			...state,
			user,
			isLoading: false,
		};
	});
};

export const setLoading = (isLoading: boolean) => {
	authStore.setState((state) => {
		return {
			...state,
			isLoading,
		};
	});
};

export const useSession = () => {
	return useAsyncApi<Outputs["auth"]["me"]>((api) => api.auth.me(), {
		key: "api:auth:me",
		server: true,
		dedupe: "defer",
	});
};

export const checkSession = async () => {
	setLoading(true);
	try {
		const { data, error, refresh, status } = useSession();

		if (status.value !== "success") {
			await refresh();
		}

		const user = data.value?.user ?? null;

		if (user) {
			setUser(user);
		} else if (error.value || status.value === "success") {
			setUser(null);
		}
	} catch (error) {
		console.error("Failed to check session:", error);
		setUser(null);
	} finally {
		setLoading(false);
	}
};

export const logout = () => {
	try {
		// Clear local storage
		if (import.meta.client) {
			localStorage.removeItem("session_token");
		}

		setUser(null);
	} catch (error) {
		console.error("Failed to logout:", error);
	}
};
