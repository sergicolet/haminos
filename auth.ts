import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Usuario", type: "text" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;

                const isValidUser =
                    credentials.username === process.env.DASHBOARD_USER &&
                    credentials.password === process.env.DASHBOARD_PASSWORD;

                if (isValidUser) {
                    return { id: "1", name: "Admin", email: "admin@haminos.com" };
                }

                return null;
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
});
