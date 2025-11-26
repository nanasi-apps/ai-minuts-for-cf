// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
	devtools: { enabled: true },

	css: ["./app/assets/index.css"],

	modules: ["nitro-cloudflare-dev"],

	compatibilityDate: "2025-11-25",

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
