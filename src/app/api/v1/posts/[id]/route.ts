import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const postId = params.id;
    const post = await prisma.posts.findUnique({
        where: { id: postId },
        select: {
            id: true,
            title: true,
            blogContent: true,
            author: true,
            datePosted: true,
            updatedAt: true,
        },
    });

    if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
}
