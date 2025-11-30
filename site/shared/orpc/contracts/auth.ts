import { oc } from "@orpc/contract";
import { z } from "zod";

const me = oc.route({ path: "/me", method: "GET" }).output(
	z.object({
		user: z
			.object({
				id: z.number(),
				email: z.email(),
				name: z.string(),
				picture: z.string().optional(),
			})
			.nullable(),
	}),
);

const logout = oc.route({ path: "/logout", method: "POST" }).output(
	z.object({
		success: z.boolean(),
	}),
);

export const auth = oc.prefix("/auth").router({
	me,
	logout,
});
