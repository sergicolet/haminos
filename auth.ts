import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const { handlers, signIn, signOut, auth } = NextAuth({
    secret: process.env.AUTH_SECRET,
    ...authConfig,
    providers: [
        Credentials({
            name: "Firebase Token",
            credentials: {
                idToken: { label: "Token", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.idToken) return null;

                try {
                    const idToken = credentials.idToken as string;
                    const decodedToken = await adminAuth().verifyIdToken(idToken);
                    const email = decodedToken.email;

                    if (!email) {
                        console.error("[Auth] El token de Firebase no tiene un email asociado.");
                        return null;
                    }

                    const usersRef = adminDb().collection('users');
                    const snapshot = await usersRef.where('email', '==', email).get();

                    if (snapshot.empty) {
                        console.error(`[Auth] Acceso denegado: El email ${email} no se encontró en la colección 'users' de Firestore.`);
                        return null; 
                    }

                    const userData = snapshot.docs[0].data();

                    return { 
                        id: snapshot.docs[0].id, 
                        name: decodedToken.name || userData.name || email.split('@')[0], 
                        email: email,
                        image: decodedToken.picture || userData.photoURL
                    };
                } catch (error) {
                    console.error("[Auth] Error en autenticación por Firebase Token:", error);
                    return null;
                }
            },
        }),
    ],
    pages: {
        signIn: '/login',
    }
});
