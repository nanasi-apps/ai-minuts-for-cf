import { os } from "@/server/orpc/os";
import users from "@/server/orpc/procedures/users";

export { os };

export const router = os.router({
	users,
});
