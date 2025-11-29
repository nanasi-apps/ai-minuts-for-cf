const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export interface GoogleUser {
	id: string;
	email: string;
	verified_email: boolean;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	locale: string;
}

export const getGoogleAuthUrl = () => {
	const params = new URLSearchParams({
		client_id: process.env.GOOGLE_CLIENT_ID!,
		redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
		response_type: "code",
		scope: "openid email profile",
		access_type: "offline",
		prompt: "consent",
	});
	return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

export const getGoogleUser = async (code: string): Promise<GoogleUser> => {
	const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			code,
			client_id: process.env.GOOGLE_CLIENT_ID!,
			client_secret: process.env.GOOGLE_CLIENT_SECRET!,
			redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
			grant_type: "authorization_code",
		}),
	});

	if (!tokenResponse.ok) {
		throw new Error("Failed to fetch Google token");
	}

	const { access_token } = (await tokenResponse.json()) as {
		access_token: string;
	};

	const userResponse = await fetch(GOOGLE_USERINFO_URL, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	});

	if (!userResponse.ok) {
		throw new Error("Failed to fetch Google user info");
	}

	return userResponse.json();
};

import { SignJWT } from "jose";

// ...

export const createSessionToken = async (userId: number) => {
	const secret = new TextEncoder().encode(
		process.env.JWT_SECRET || "default-secret-change-me",
	);

	return new SignJWT({ userId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(secret);
};
