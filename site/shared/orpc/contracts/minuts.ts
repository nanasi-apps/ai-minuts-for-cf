import { oc } from "@orpc/contract";
import * as z from "zod";

const generatePresignedUrl = oc
	.route({
		path: "/generate-presigned-url",
		method: "POST",
	})
	.input(
		z.object({
			filename: z.string().min(1),
			contentType: z.enum(["video/mp4", "audio/mpeg", "audio/wav"]),
			fileSize: z.number().int().positive(),
			audio: z
				.object({
					filename: z.string().min(1),
					contentType: z.enum(["audio/wav", "audio/mpeg"]),
					fileSize: z.number().int().positive(),
				})
				.optional(),
		}),
	)
	.output(
		z.object({
			uploadUrl: z.url(),
			key: z.string(),
			audioUploadUrl: z.url().optional(),
			audioKey: z.string().optional(),
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
		path: "/:minutsId",
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
			subtitle: z.string().nullable(),
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
		path: "/:minutsId",
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

const update = oc
	.route({
		path: "/:minutsId",
		method: "PATCH",
	})
	.input(
		z.object({
			minutsId: z.coerce.number().int().positive(),
			title: z.string().min(1),
		}),
	)
	.output(
		z.object({
			minuts: z.object({
				id: z.number(),
				title: z.string(),
			}),
		}),
	);

export const minuts = oc.prefix("/minuts").router({
	generatePresignedUrl,
	list,
	process,
	get,
	regenerateSummary,
	update,
	delete: remove,
});
