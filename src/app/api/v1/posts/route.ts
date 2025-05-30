import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function GET() {
    const posts = await prisma.posts.findMany({
        select: {
            id: true,
            title: true,
            blogContent: true,
            author: true,
            datePosted: true,
            updatedAt: true,
        },
        orderBy: {
            datePosted: "desc",
        },
    });
    return NextResponse.json({ success: true, errors: [], data: posts });
}
