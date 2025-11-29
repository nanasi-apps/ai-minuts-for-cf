import { createPrismaClient } from "@/server/prisma-client";
import { createSessionToken, getGoogleUser } from "@/server/utils/auth";

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const code = query.code as string;

	if (!code) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing code",
		});
	}

	try {
		const googleUser = await getGoogleUser(code);
		const env = event.context.cloudflare?.env;
		if (!env?.ai_minuts) {
			console.error(
				"Cloudflare environment or ai_minuts binding missing. Available keys:",
				env ? Object.keys(env) : "env is undefined",
			);
			throw createError({
				statusCode: 500,
				statusMessage: "Database configuration error",
			});
		}
		const database = env.ai_minuts as D1Database | undefined;
		if (!database) {
			throw createError({
				statusCode: 500,
				statusMessage: "Database binding missing",
			});
		}
		const prisma = createPrismaClient(database);
		// Find or create user
		let user = await prisma.user.findUnique({
			where: { email: googleUser.email },
		});

		if (!user) {
			user = await prisma.user.create({
				data: {
					email: googleUser.email,
					name: googleUser.name,
					avatarUrl: googleUser.picture,
					accounts: {
						create: {
							provider: "google",
							providerId: googleUser.id,
						},
					},
				},
			});

			// Auto-join organizations
			const domain = googleUser.email.split("@")[1];
			if (domain) {
				const organizations = await prisma.organization.findMany({
					where: {
						allowedDomains: {
							contains: domain,
						},
					},
				});

				for (const org of organizations) {
					// Check if domain is actually allowed (exact match or comma separated)
					const allowedDomains = org.allowedDomains
						? org.allowedDomains.split(",").map((d) => d.trim())
						: [];
					if (allowedDomains.includes(domain)) {
						await prisma.organizationMember.create({
							data: {
								organizationId: org.id,
								userId: user.id,
								role: "MEMBER",
							},
						});
					}
				}
			}
		} else {
			// Update user info if needed
			await prisma.user.update({
				where: { id: user.id },
				data: {
					name: googleUser.name,
					avatarUrl: googleUser.picture,
				},
			});

			// Ensure account link exists
			const account = await prisma.account.findUnique({
				where: {
					provider_providerId: {
						provider: "google",
						providerId: googleUser.id,
					},
				},
			});

			if (!account) {
				await prisma.account.create({
					data: {
						userId: user.id,
						provider: "google",
						providerId: googleUser.id,
					},
				});
			}
		}

		const token = await createSessionToken(user.id);

		// Redirect to client callback page with token
		return sendRedirect(event, `/auth/callback?token=${token}`, 302);
	} catch (error) {
		console.error("Google OAuth error:", error);
		throw createError({
			statusCode: 500,
			statusMessage: "Authentication failed",
		});
	}
});
