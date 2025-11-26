import { oc } from "@orpc/contract";
import users from "#/orpc/users";

export const contract = oc.router({
	users,
});
