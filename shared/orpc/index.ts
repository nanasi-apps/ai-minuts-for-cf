import { oc } from "@orpc/contract";
import { organizations } from "#/orpc/organizations";
import users from "#/orpc/users";

export const contract = oc.router({
	users,
	organizations,
});
