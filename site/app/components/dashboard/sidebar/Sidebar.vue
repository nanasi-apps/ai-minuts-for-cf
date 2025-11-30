<script setup lang="ts">
import SidebarItem from "@/app/components/dashboard/sidebar/SidebarItem.vue";
import { logout } from "@/app/stores/auth";

const router = useRouter();

defineProps<{
	items: Array<{
		name: string;
		icon: string;
		route: string;
	}>;
}>();

const goToRoute = (route: string) => {
	router.push(route);
};

const handleLogout = () => {
	logout();
	window.location.href = "/login";
};
</script>

<template>
    <div class="min-w-48 lg:min-w-2xs bg-stone-100 dark:bg-stone-900 h-min-screen p-6">
      <nav class="space-y-2">
        <SidebarItem v-for="item in items" :key="item.route" :item="item" @click="goToRoute(item.route)" />
        <div class="pt-4 mt-4 border-t border-stone-200 dark:border-stone-800">
          <SidebarItem :item="{ name: 'ログアウト', icon: 'mdi-logout', route: '' }" @click="handleLogout" />
        </div>
      </nav>
    </div>
</template>

<style scoped>

</style>
