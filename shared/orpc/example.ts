import { oc } from "@orpc/contract";
import * as z from "zod";

export const test = oc
	.route({
		path: "/test",
		method: "GET",
	})
	.output(
		z.object({
			message: z.string(),
		}),
	);

export const example = oc.prefix("/example").router({
	test,
});
