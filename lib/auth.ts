import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"

/**
 * Refresh an expired Google OAuth access token using the refresh token.
 */
async function refreshAccessToken(token: any) {
    try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            }),
        })

        const refreshed = await response.json()

        if (!response.ok) {
            throw new Error(refreshed.error || "Failed to refresh token")
        }

        console.log("Access token refreshed successfully")

        return {
            ...token,
            accessToken: refreshed.access_token,
            // Google returns expires_in in seconds; convert to absolute ms timestamp
            accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
            // Google only returns a new refresh_token if the old one was revoked
            refreshToken: refreshed.refresh_token ?? token.refreshToken,
        }
    } catch (error) {
        console.error("Error refreshing access token:", error)
        return {
            ...token,
            error: "RefreshAccessTokenError",
        }
    }
}

export const authOptions: NextAuthOptions = {
    debug: true,
    secret: process.env.NEXTAUTH_SECRET,
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/drive.file",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.accessToken = token.accessToken as string;
            }
            // Surface token refresh errors so the UI can prompt re-login
            if (token.error) {
                (session as any).error = token.error;
            }
            return session;
        },
        async jwt({ token, user, account }) {
            // Initial sign-in: capture user info + all token fields
            if (user) {
                console.log("JWT Callback - User:", user.id, (user as any).role)
                token.id = user.id;
                token.role = (user as any).role;
            }
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                // expires_at from Google is in seconds since epoch
                token.accessTokenExpires = (account.expires_at ?? 0) * 1000;
                return token;
            }

            // Subsequent requests: check if the access token is still valid
            // Refresh 60 seconds early to avoid edge-case expiry during upload
            if (
                typeof token.accessTokenExpires === "number" &&
                Date.now() < token.accessTokenExpires - 60_000
            ) {
                // Token is still valid
                return token;
            }

            // Token has expired — attempt refresh
            console.log("Access token expired, refreshing...")
            return await refreshAccessToken(token);
        },
    },
}
