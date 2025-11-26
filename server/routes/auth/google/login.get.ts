import { getGoogleAuthUrl } from "~/server/utils/auth";

export default defineEventHandler((event) => {
	const url = getGoogleAuthUrl();
	return sendRedirect(event, url);
});
