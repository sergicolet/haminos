import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isDashboard = nextUrl.pathname.startsWith("/dashboard");
            const isHome = nextUrl.pathname === "/";
            const isLogin = nextUrl.pathname === "/login";

            if (isDashboard || isHome) {
                if (isLoggedIn) return true;
                return false; 
            } else if (isLogin && isLoggedIn) {
                return Response.redirect(new URL("/dashboard", nextUrl));
            }
            return true;
        },
    },
    providers: [], 
    trustHost: true,
} satisfies NextAuthConfig;
