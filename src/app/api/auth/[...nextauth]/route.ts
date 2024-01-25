import { UserByUsername } from "@/lib/User";
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { authOptions } from "./options";
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
