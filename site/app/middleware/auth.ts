import { authStore, checkSession } from "@/app/stores/auth";

export default defineNuxtRouteMiddleware(async (to) => {
	if (import.meta.server) return;

	const token = localStorage.getItem("session_token");
	if (!token) {
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
