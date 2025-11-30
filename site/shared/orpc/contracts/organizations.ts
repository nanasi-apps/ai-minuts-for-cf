import { oc } from "@orpc/contract";
import { z } from "zod";

const create = oc
	.route({
		path: "/create",
		method: "POST",
	})
	.input(
		z.object({
			name: z.string().min(1, "Name is required"),
			slug: z
				.string()
				.min(1, "Slug is required")
				.regex(
					/^[a-z0-9-]+$/,
					"Slug must be lowercase alphanumeric with hyphens",
				),
		}),
	)
	.output(
		z.object({
			id: z.number(),
			name: z.string(),
			slug: z.string(),
		}),
	);

const list = oc
	.route({
		path: "/list",
		method: "GET",
	})
	.output(
		z.array(
			z.object({
				id: z.number(),
				name: z.string(),
				slug: z.string(),
				role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
			}),
		),
	);

const get = oc
	.route({
		path: "/{slug}",
		method: "GET",
	})
	.input(z.object({ slug: z.string() }))
	.output(
		z.object({
			id: z.number(),
			name: z.string(),
			slug: z.string(),
			allowedDomains: z.string().nullable(),
			role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
			members: z.array(
				z.object({
					id: z.number(),
					name: z.string().nullable(),
					email: z.string(),
					role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
					avatarUrl: z.string().nullable(),
				}),
			),
		}),
	);

const update = oc
	.route({
		path: "/update",
		method: "POST",
	})
	.input(
		z.object({
			id: z.number(),
			name: z.string().optional(),
			allowedDomains: z.string().optional(),
		}),
	)
	.output(
		z.object({
			id: z.number(),
			name: z.string(),
			allowedDomains: z.string().nullable(),
		}),
	);

const invite = oc
	.route({
		path: "/invite",
		method: "POST",
	})
	.input(
		z.object({
			organizationId: z.number(),
			email: z.string().email("Invalid email address"),
			role: z.enum(["ADMIN", "MEMBER"]),
		}),
	)
	.output(
		z.object({
			id: z.number(),
			token: z.string(),
		}),
	);

const addAdmin = oc
	.route({
		path: "/add-admin",
		method: "POST",
	})
	.input(
		z.object({
			organizationId: z.number(),
			userId: z.number(),
		}),
	)
	.output(
		z.object({
			id: z.number(),
			role: z.string(),
		}),
	);

export const organizations = oc.prefix("/organizations").router({
	create,
	list,
	get,
	update,
	invite,
	addAdmin,
});
