import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function GET(req: NextRequest) {
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
