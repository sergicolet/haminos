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
                    
                    // 1. Verificamos el token con Firebase Admin (garantiza que el link o Google Auth es legítimo y seguro)
                    const decodedToken = await adminAuth.verifyIdToken(idToken);
                    const email = decodedToken.email;

                    if (!email) {
                        console.error("El token de Firebase no tiene un email asociado.");
                        return null;
                    }

                    // 2. Buscamos si el usuario existe en la colección 'users' de Firestore
                    const usersRef = adminDb.collection('users');
                    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

                    if (snapshot.empty) {
                        console.error(`Acceso denegado: El email ${email} no está en la base de datos de usuarios.`);
                        return null; // Rechazar el login (Lanzará un Access Denied en el front)
                    }

                    const userData = snapshot.docs[0].data();

                    // ¡Permitir paso! Construimos la sesión en NextAuth
                    return { 
                        id: snapshot.docs[0].id, 
                        name: decodedToken.name || userData.name || email.split('@')[0], 
                        email: email,
                        image: decodedToken.picture || userData.photoURL
                    };
                } catch (error) {
                    console.error("Error en autenticación por Firebase Token:", error);
                    return null;
                }
            },
        }),
    ],
    pages: {
        signIn: '/login',
    }
});
