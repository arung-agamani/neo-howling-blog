import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { verifyRole } from "@/hooks/useRoleAuth";
import { NotFound, Unauthorized } from "@/app/api/responses";

export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    const searchParams = req.nextUrl.searchParams;
    const username = searchParams.get("username");

    if (username) {
        // Get specific user by username
        const user = await prisma.users.findFirst({
            where: { username },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                role: true,
                birthday: true,
                gender: true,
                phone: true,
            },
        });

        if (!user) {
            return NotFound();
        }

        return NextResponse.json(user);
    }

    // Get all users
    const users = await prisma.users.findMany({
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            role: true,
            birthday: true,
            gender: true,
            phone: true,
            // add/remove fields as needed
        },
    });
    return NextResponse.json({ users });
}
