import { oc } from "@orpc/contract";
import { z } from "zod";

const generatePresignedUrl = oc
	.input(
		z.object({
			filename: z.string().min(1),
			contentType: z.enum(["video/mp4", "audio/mpeg"]),
			fileSize: z.number().int().positive(),
		}),
	)
	.output(
		z.object({
			uploadUrl: z.string().url(),
			key: z.string(),
		}),
	);

const list = oc.route({ path: "/list", method: "GET" }).output(
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
	generatePresignedUrl,
	list,
});
