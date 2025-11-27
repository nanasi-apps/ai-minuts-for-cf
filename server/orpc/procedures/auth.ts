import { authMiddleware } from "@/server/middlewares/auth";
import type { ORPCContext } from "@/server/orpc/os";
import { os } from "@/server/orpc/os";

export default {
	me: os.auth.me.use(authMiddleware).handler(async ({ context }) => {
		const userId = context.userId;

		const user = await context.db.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				name: true,
				avatarUrl: true,
			},
		});

		if (!user) {
			return { user: null };
		}

		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name || "",
				...(user.avatarUrl ? { picture: user.avatarUrl } : {}),
			},
		};
	}),
	logout: os.auth.logout.handler(
		async ({ context }: { context: ORPCContext }) => {
			deleteCookie(context.event, "session_token");
			return { success: true };
		},
	),
};
