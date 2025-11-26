import { oc } from "@orpc/contract";
import { z } from "zod";

export const organizations = oc.router({
	create: oc
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
		),

	invite: oc
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
		),

	addAdmin: oc
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
		),
});
