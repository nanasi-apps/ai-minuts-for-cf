import { oc } from "@orpc/contract";
import * as z from "zod";

const upload = oc
	.route({
		path: "/upload",
		method: "POST",
	})
	.output(
		z.object({ uploadUrl: z.url(), fileId: z.string(), expiresAt: z.string() }),
	);

const list = oc
	.route({
		path: "/list",
		method: "GET",
	})
	.output(
		z.array(
			z.object({
				id: z.string(),
				title: z.string(),
				date: z.string(),
				durationMinutes: z.number(),
				expiresAt: z.string(),
			}),
		),
	);

export const minuts = oc.prefix("/minuts").router({
	upload,
	list,
});
