"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import {
    TUpdateUserPayload,
    TUpdateUserResponse,
    UpdateUserPayload,
} from "@/types";
import prisma from "@/utils/prisma";
import { getServerSession } from "next-auth";
export async function updateUser(
    data: TUpdateUserPayload,
): Promise<TUpdateUserResponse> {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
        return { success: false, message: "Unauthorized request" };
    }
    try {
        const validate = UpdateUserPayload.safeParse(data);
        if (!validate.success) {
            return { success: false, message: "Validation error" };
        }
        const update = await prisma.users.updateMany({
            where: {
                username: validate.data.username,
            },
            data: {
                role: validate.data.role,
            },
        });
        return { success: true, updated: update.count };
    } catch (error) {
        console.error(`Error on updateUser server action`);
        console.log(error);
        return { success: false, message: "Internal server error" };
    }
}
