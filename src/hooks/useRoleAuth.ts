import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { TUserRoles } from "@/types";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function useRoleAuth(
    roles: TUserRoles[],
    redirectUrl: string = "/dashboard/main",
) {
    const session = await getServerSession(authOptions);
    if (!roles.includes(session?.user?.role || "guest")) {
        redirect(redirectUrl);
    }
}
