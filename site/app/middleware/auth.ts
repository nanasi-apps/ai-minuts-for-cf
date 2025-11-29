import { authStore, checkSession } from "@/app/stores/auth";

export default defineNuxtRouteMiddleware(async (_to) => {
	if (import.meta.server) return;

	const token = useCookie("session_token");

	if (!token.value) {
		return navigateTo("/login");
	}

	const user = authStore.state.user;
	if (!user) {
		await checkSession();
		if (!authStore.state.user) {
			return navigateTo("/login");
		}
	}
});
