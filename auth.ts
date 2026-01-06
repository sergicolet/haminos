import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Credenciales hardcoded para desarrollo y producción
// En Easypanel funcionan porque se compilan en el build
const ADMIN_USER = "admin";
const ADMIN_PASS = "haminos2026";

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

                if (user === ADMIN_USER && pass === ADMIN_PASS) {
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
