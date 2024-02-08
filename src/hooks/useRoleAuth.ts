import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { TUserRoles } from "@/types";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

async function useRoleAuth(
    roles: TUserRoles[],
    redirectUrl: string = "/dashboard/main",
) {
    const session = await getServerSession(authOptions);
    if (!roles.includes(session?.user?.role || "guest")) {
        redirect(redirectUrl);
    }
}

export async function verifyRole(req: NextRequest, roles: TUserRoles[]) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!roles.includes(token?.role || "no-auth")) {
        return false;
    }
    return true;
}

export default useRoleAuth;
