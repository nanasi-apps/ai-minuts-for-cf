import { oc } from "@orpc/contract";
import { z } from "zod";

export const auth = oc.router({
	me: oc.output(
		z.object({
			user: z
				.object({
					id: z.number(),
					email: z.string().email(),
					name: z.string(),
					picture: z.string().optional(),
				})
				.nullable(),
		}),
	),
	logout: oc.output(
		z.object({
			success: z.boolean(),
		}),
	),
});

export default auth;
