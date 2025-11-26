// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
	devtools: { enabled: true },

	css: ["./app/assets/index.css"],

	modules: ["nitro-cloudflare-dev", "@nuxtjs/i18n"],

	compatibilityDate: "2025-11-25",

	i18n: {
		defaultLocale: "ja",
		locales: [
			{ code: "en", name: "English", file: "en.json" },
			{ code: "ja", name: "日本語", file: "ja.json" },
		],
		lazy: true,
		strategy: "no_prefix",
	},

	// Provide path aliases: $root -> root, # -> shared
	alias: {
		"@": fileURLToPath(new URL("./", import.meta.url)),
		"#": fileURLToPath(new URL("./shared", import.meta.url)),
	},
	nitro: {
		prerender: {
			autoSubfolderIndex: false,
		},
		alias: {
			"@": fileURLToPath(new URL("./", import.meta.url)),
			"#": fileURLToPath(new URL("./shared", import.meta.url)),
		},
		preset: "cloudflare-module",
		cloudflare: {
			deployConfig: true,
		},
		// Required for Prisma with D1 adapter on Cloudflare Workers
		experimental: {
			wasm: true,
		},
		moduleSideEffects: ["@prisma/client/runtime/library.js"],
	},
	vite: {
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./", import.meta.url)),
				"#": fileURLToPath(new URL("./shared", import.meta.url)),
			},
		},
		plugins: [tailwindcss()],
		build: {
			sourcemap: false,
		},
	},
});
