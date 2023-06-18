import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { verifyToken } from "@/utils/jwt";
import prisma from "@/utils/prisma";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(verifyToken);

router.get(async (req, res) => {
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
    return res.json({
        message: "Dashbaord page",
        stats: {
            total: totalPost,
            unpublished: unpubPost,
            recentPosts,
            tags,
            untaggedPosts,
        },
    });
});

export default router.handler();
