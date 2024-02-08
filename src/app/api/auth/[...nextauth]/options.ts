import { UserByUsername } from "@/lib/User";
import { TUserRoles } from "@/types";
import bcrypt from "bcrypt";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: {
                    label: "Username",
                    type: "text",
                    placeholder: "frieren",
                },
                password: {
                    label: "Password",
                    type: "password",
                },
            },
            async authorize(credentials, req) {
                if (!credentials) return null;
                const user = await UserByUsername(credentials?.username);
                if (!user) return null;
                const match = bcrypt.compareSync(
                    credentials.password,
                    user.password,
                );
                if (!match) return null;
                // TODO: Rework role assignment to infer from highest
                return {
                    ...user,
                    password: null,
                    role: user.role as TUserRoles,
                };
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) session.user.role = token.role;
            return session;
        },
    },
};
