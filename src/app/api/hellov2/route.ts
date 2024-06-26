import { authOptions } from "../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({
            message: "こんにちは！",
        });
    }

    const user = await prisma.users.findFirst({
        where: { email: session.user!.email! },
    });
    if (!user) {
        return NextResponse.json({
            message: "こんにちは！2",
        });
    }
    return NextResponse.json({
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            birthday: user.birthday ? new Date(user.birthday) : null,
            gender: user.gender,
            phone: user.phone,
        },
    });
}
