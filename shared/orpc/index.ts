import { oc } from "@orpc/contract";
import { example } from "#/orpc/example";

export const contract = oc.router({
	example,
});
