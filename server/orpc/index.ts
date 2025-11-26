import { os } from "@/server/orpc/os";
import organizations from "@/server/orpc/procedures/organizations";
import users from "@/server/orpc/procedures/users";

export { os };

export const router = os.router({
	users,
	organizations,
});
