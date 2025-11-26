import { Store } from "@tanstack/vue-store";

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
		const { $api } = useNuxtApp();
		const { user } = await ($api as any).auth.me();
		setUser(user);
	} catch (error) {
		console.error("Failed to check session:", error);
		setUser(null);
	} finally {
		setLoading(false);
	}
};

export const logout = async () => {
	try {
		const { $api } = useNuxtApp();
		await ($api as any).auth.logout();
		const router = useRouter();
		setUser(null);
		await router.push("/");
	} catch (error) {
		console.error("Failed to logout:", error);
	}
};
