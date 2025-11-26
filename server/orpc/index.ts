import { os } from "@/server/orpc/os";
import { example } from "@/server/orpc/procedures/example";

export { os };

export const router = os.router({
	example,
});
