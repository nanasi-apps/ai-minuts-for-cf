import { ORPCError } from "@orpc/server";

import { authMiddleware } from "@/server/middlewares/auth";
import { os } from "@/server/orpc/os";
import { OrganizationRole } from "@/server/prisma-client/client";

export default {
	create: os.organizations.create
		.use(authMiddleware)
		.handler(async ({ input, context }) => {
			const userId = context.userId;

			const existingOrg = await context.db.organization.findUnique({
				where: { slug: input.slug },
			});

			if (existingOrg) {
				throw new ORPCError("CONFLICT", {
					message: "Organization slug already exists",
				});
			}

			const org = await context.db.$transaction(async (tx) => {
				const newOrg = await tx.organization.create({
					data: {
						name: input.name,
						slug: input.slug,
					},
				});

				await tx.organizationMember.create({
					data: {
						organizationId: newOrg.id,
						userId: userId,
						role: OrganizationRole.OWNER,
					},
				});

				return newOrg;
			});

			return org;
		}),

	list: os.organizations.list
		.use(authMiddleware)
		.handler(async ({ context }) => {
			const userId = context.userId;

			const members = await context.db.organizationMember.findMany({
				where: { userId },
				include: { organization: true },
			});

			return members.map((m) => ({
				id: m.organization.id,
				name: m.organization.name,
				slug: m.organization.slug,
				role: m.role,
			}));
		}),

	get: os.organizations.get
		.use(authMiddleware)
		.handler(async ({ input, context }) => {
			const userId = context.userId;

			const org = await context.db.organization.findUnique({
				where: { slug: input.slug },
				include: {
					members: {
						include: {
							user: true,
						},
					},
				},
			});

			if (!org) {
				throw new ORPCError("NOT_FOUND", {
					message: "Organization not found",
				});
			}

			const member = org.members.find((m) => m.userId === userId);
			if (!member) {
				throw new ORPCError("FORBIDDEN", {
					message: "You are not a member of this organization",
				});
			}

			return {
				id: org.id,
				name: org.name,
				slug: org.slug,
				allowedDomains: org.allowedDomains,
				role: member.role,
				members: org.members.map((m) => ({
					id: m.id,
					name: m.user.name,
					email: m.user.email,
					role: m.role,
					avatarUrl: m.user.avatarUrl,
				})),
			};
		}),

	update: os.organizations.update
		.use(authMiddleware)
		.handler(async ({ input, context }) => {
			const userId = context.userId;

			const member = await context.db.organizationMember.findUnique({
				where: {
					organizationId_userId: {
						organizationId: input.id,
						userId: userId,
					},
				},
			});

			if (!member || member.role !== OrganizationRole.OWNER) {
				throw new ORPCError("FORBIDDEN", {
					message: "Only OWNER can update organization settings",
				});
			}

			const updatedOrg = await context.db.organization.update({
				where: { id: input.id },
				data: {
					name: input.name,
					allowedDomains: input.allowedDomains,
				},
			});

			return {
				id: updatedOrg.id,
				name: updatedOrg.name,
				allowedDomains: updatedOrg.allowedDomains,
			};
		}),

	invite: os.organizations.invite
		.use(authMiddleware)
		.handler(async ({ input, context }) => {
			const userId = context.userId;

			const member = await context.db.organizationMember.findUnique({
				where: {
					organizationId_userId: {
						organizationId: input.organizationId,
						userId: userId,
					},
				},
			});

			if (
				!member ||
				(member.role !== OrganizationRole.OWNER &&
					member.role !== OrganizationRole.ADMIN)
			) {
				throw new ORPCError("FORBIDDEN", {
					message: "You do not have permission to invite members",
				});
			}

			const existingInvitation =
				await context.db.organizationInvitation.findUnique({
					where: {
						organizationId_email: {
							organizationId: input.organizationId,
							email: input.email,
						},
					},
				});

			if (existingInvitation) {
				throw new ORPCError("CONFLICT", {
					message: "User already invited",
				});
			}

			const userToInvite = await context.db.user.findUnique({
				where: { email: input.email },
			});

			if (userToInvite) {
				const existingMember = await context.db.organizationMember.findUnique({
					where: {
						organizationId_userId: {
							organizationId: input.organizationId,
							userId: userToInvite.id,
						},
					},
				});
				if (existingMember) {
					throw new ORPCError("CONFLICT", {
						message: "User is already a member",
					});
				}
			}

			const token = crypto.randomUUID();
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + 7);

			const invitation = await context.db.organizationInvitation.create({
				data: {
					organizationId: input.organizationId,
					email: input.email,
					role: input.role as OrganizationRole,
					token,
					expiresAt,
				},
			});

			return {
				id: invitation.id,
				token: invitation.token,
			};
		}),

	addAdmin: os.organizations.addAdmin
		.use(authMiddleware)
		.handler(async ({ input, context }) => {
			const userId = context.userId;

			const requester = await context.db.organizationMember.findUnique({
				where: {
					organizationId_userId: {
						organizationId: input.organizationId,
						userId: userId,
					},
				},
			});

			if (!requester || requester.role !== OrganizationRole.OWNER) {
				throw new ORPCError("FORBIDDEN", {
					message: "Only OWNER can add co-administrators",
				});
			}

			const targetMember = await context.db.organizationMember.findUnique({
				where: {
					organizationId_userId: {
						organizationId: input.organizationId,
						userId: input.userId,
					},
				},
			});

			if (!targetMember) {
				throw new ORPCError("NOT_FOUND", {
					message: "Member not found",
				});
			}

			const updatedMember = await context.db.organizationMember.update({
				where: {
					id: targetMember.id,
				},
				data: {
					role: OrganizationRole.ADMIN,
				},
			});

			return {
				id: updatedMember.id,
				role: updatedMember.role,
			};
		}),
};
