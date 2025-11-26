import { oc } from "@orpc/contract";
import auth from "#/orpc/auth";
import { organizations } from "#/orpc/organizations";
import users from "#/orpc/users";

export const contract = oc.router({
	users,
	organizations,
	auth,
});
