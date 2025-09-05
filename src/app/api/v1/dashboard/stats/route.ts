import { NextRequest, NextResponse } from "next/server";
import { verifyRole } from "@/hooks/useRoleAuth";
import { Unauthorized } from "@/app/api/responses";
import prisma from "@/utils/prisma";

export const dynamic = "force-dynamic";

// GET /api/v1/dashboard/stats (get dashboard statistics)
export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor", "user", "guest"]))) {
        return Unauthorized();
    }

    try {
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
            message: "Dashboard stats",
            stats: {
                total: totalPost,
                unpublished: unpubPost,
                recentPosts,
                tags,
                untaggedPosts,
            },
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats" },
            { status: 500 }
        );
    }
}
