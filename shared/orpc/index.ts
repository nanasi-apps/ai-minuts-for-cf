import { oc } from "@orpc/contract";
import auth from "#/orpc/contracts/auth";
import { organizations } from "#/orpc/contracts/organizations";
import users from "#/orpc/contracts/users";

export const contract = oc.router({
	users,
	organizations,
	auth,
});
