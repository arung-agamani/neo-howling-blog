import { UserByUsername } from "@/lib/User";
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

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
                    user.password
                );
                if (!match) return null;
                return user;
            },
        }),
    ],
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
