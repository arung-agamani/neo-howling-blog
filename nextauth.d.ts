import { TUserRoles } from "@/types";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface User {
        role?: TUserRoles;
    }

    interface Session extends DefaultSession {
        user?: User;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: TUserRoles;
    }
}
