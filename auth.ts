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

                const user = credentials.username as string;
                const pass = credentials.password as string;

                // Leer credenciales de variables de entorno
                const validUser = process.env.AUTH_USER || "admin";
                const validPass = process.env.AUTH_PASS || "haminos2026";

                if (user === validUser && pass === validPass) {
                    return { id: "1", name: "Admin", email: "admin@haminos.com" };
                }

                return null;
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    trustHost: true,
});
