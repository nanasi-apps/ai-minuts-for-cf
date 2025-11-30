import { oc } from "@orpc/contract";
import * as z from "zod";

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
			minutsId: z.number(),
		}),
	);

const list = oc.route({ path: "/list", method: "GET" }).output(
	z.array(
		z.object({
			id: z.number(),
			title: z.string(),
			status: z.string(),
			createdAt: z.string(),
		}),
	),
);

const process = oc
	.route({
		path: "/process",
		method: "POST",
	})
	.input(
		z.object({
			minutsId: z.coerce.number().int().positive(),
		}),
	)
	.output(
		z.object({
			success: z.boolean(),
			message: z.string().optional(),
		}),
	);

const get = oc
	.route({
		path: "/:id",
		method: "GET",
	})
	.input(
		z.object({
			minutsId: z.coerce.number().int().positive(),
		}),
	)
	.output(
		z.object({
			id: z.number(),
			title: z.string(),
			status: z.string(),
			summary: z.string().nullable(),
			transcript: z.string().nullable(),
			videoUrl: z.string().nullable(),
			createdAt: z.string(),
		}),
	);

const regenerateSummary = oc
	.route({
		path: "/regenerate-summary",
		method: "POST",
	})
	.input(
		z.object({
			minutsId: z.coerce.number().int().positive(),
		}),
	)
	.output(
		z.object({
			success: z.boolean(),
			message: z.string().optional(),
		}),
	);

const remove = oc
	.route({
		path: "/:id",
		method: "DELETE",
	})
	.input(
		z.object({
			minutsId: z.coerce.number().int().positive(),
		}),
	)
	.output(
		z.object({
			success: z.boolean(),
		}),
	);

export const minuts = oc.prefix("/minuts").router({
	generatePresignedUrl,
	list,
	process,
	get,
	regenerateSummary,
	delete: remove,
});
