import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const userId = params.id;
    const user = await prisma.users.findUnique({
        where: { id: userId },
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

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const userId = params.id;
    const data = await req.json();

    // Only allow specific fields and only if present
    const allowedFields = ["name", "role", "birthday", "gender", "phone"];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
        if (field in data) {
            updateData[field] = data[field];
        }
    }

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
            { error: "No valid fields provided for update" },
            { status: 400 }
        );
    }

    try {
        const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: updateData,
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
        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        return NextResponse.json(
            { error: "User not found or update failed" },
            { status: 404 }
        );
    }
}
