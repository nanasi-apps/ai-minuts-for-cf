import { oc } from "@orpc/contract";
import auth from "#/orpc/contracts/auth";
import { organizations } from "#/orpc/contracts/organizations";
import users from "#/orpc/contracts/users";
import { minuts } from "#/orpc/contracts/minuts";

export const contract = oc.router({
	users,
	organizations,
	auth,
	minuts,
});
