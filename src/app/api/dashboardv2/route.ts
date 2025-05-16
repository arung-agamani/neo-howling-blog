import { verifyRole } from "@/hooks/useRoleAuth";
import prisma from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Unauthorized } from "../responses";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor", "user", "guest"]))) {
        return Unauthorized();
    }
    const totalPost = await prisma.posts.count();
    const unpubPost = await prisma.posts.count({
        where: { isPublished: false },
    });
    const recentPosts = await prisma.posts.findMany({
        where: {
            OR: [
                {
                    deleted: {
                        isSet: false,
                    },
                },
                {
                    deleted: false,
                },
            ],
        },
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
    // Change: fetch tags with name and count directly
    const tags = await prisma.tags.findMany({
        select: {
            name: true,
            count: true,
        },
        orderBy: {
            count: "desc",
        },
        take: 10,
    });
    const untaggedPosts = await prisma.posts.findMany({
        where: {
            tags: {
                isEmpty: true,
            },
            OR: [
                {
                    deleted: {
                        isSet: false,
                    },
                },
                {
                    deleted: false,
                },
            ],
        },
        select: {
            id: true,
            title: true,
            description: true,
        },
        take: 5,
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
