import type { ORPCContext } from "@/server/orpc/os";
import { os } from "@/server/orpc/os";
import { verifySessionToken } from "@/server/utils/auth";

export default {
	me: os.auth.me.handler(async ({ context }: { context: ORPCContext }) => {
		const token = getCookie(context.event, "session_token");

		if (!token) {
			return { user: null };
		}

		const payload = await verifySessionToken(token);
		if (!payload) {
			return { user: null };
		}

		const user = await context.db.user.findUnique({
			where: { id: payload.userId },
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
