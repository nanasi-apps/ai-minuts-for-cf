import { os } from "@/server/orpc/os";
import auth from "@/server/orpc/procedures/auth";
import organizations from "@/server/orpc/procedures/organizations";
import users from "@/server/orpc/procedures/users";
import minuts from "@/server/orpc/procedures/minuts";

export { os };

export const router = os.router({
	users,
	organizations,
	auth,
	minuts,
});
