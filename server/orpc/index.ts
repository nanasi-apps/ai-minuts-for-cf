import { os } from "@/server/orpc/os";
import auth from "@/server/orpc/procedures/auth";
import organizations from "@/server/orpc/procedures/organizations";
import users from "@/server/orpc/procedures/users";

export { os };

export const router = os.router({
	users,
	organizations,
	auth,
});
