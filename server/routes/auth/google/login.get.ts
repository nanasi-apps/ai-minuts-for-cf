import { getGoogleAuthUrl } from "@/server/utils/auth";

export default defineEventHandler(async (event) => {
	const url = getGoogleAuthUrl();
	return sendRedirect(event, url, 302);
});
