import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, res: NextResponse) {
    const totalPost = await prisma.posts.count();
    const unpubPost = await prisma.posts.count({
        where: { isPublished: false },
    });
    const recentPosts = await prisma.posts.findMany({
        orderBy: {
            datePosted: "desc",
        },
        take: 5,
        select: {
            id: true,
            title: true,
            description: true,
        },
    });
    const tags = await prisma.tags.groupBy({
        by: ["name"],
        _sum: {
            count: true,
        },
        orderBy: {
            _sum: {
                count: "desc",
            },
        },
    });
    const untaggedPosts = await prisma.posts.findMany({
        where: {
            tags: {
                isEmpty: true,
            },
        },
        select: {
            id: true,
            title: true,
            description: true,
        },
    });
    return NextResponse.json({
        message: "Dashboard page",
        stats: {
            total: totalPost,
            unpublished: unpubPost,
            recentPosts,
            tags,
            untaggedPosts,
        },
    });
}
