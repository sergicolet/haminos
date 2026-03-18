import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth({ ...authConfig, secret: process.env.AUTH_SECRET }).auth;

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

