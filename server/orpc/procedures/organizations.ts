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
