import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Polyfill for __dirname and __filename in ES modules
// This is needed for Prisma Client which uses these CommonJS globals
export default defineNitroPlugin(() => {
	if (typeof globalThis.__dirname === "undefined") {
		// @ts-expect-error
		globalThis.__dirname = dirname(fileURLToPath(import.meta.url));
	}
	if (typeof globalThis.__filename === "undefined") {
		// @ts-expect-error
		globalThis.__filename = fileURLToPath(import.meta.url);
	}
});
