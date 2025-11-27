import { Store } from "@tanstack/vue-store";
import { useApi } from "@/app/composable/useApi";

interface User {
	id: number;
	email: string;
	name: string;
	picture?: string;
}

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

export const checkSession = async () => {
	setLoading(true);
	try {
		console.log("Checking session...");
		const api = useApi();
		const { user } = await api.auth.me();
		console.log("Session valid, user:", user);
		setUser(user);
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
