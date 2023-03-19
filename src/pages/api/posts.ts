import prisma from "@/utils/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
const router = createRouter<NextApiRequest, NextApiResponse>();

router.get(async (req, res) => {
    let page = 1;
    if (req.query.p) {
        let p = Array.isArray(req.query.p) ? req.query.p[0] : req.query.p;
        page = isNaN(Number(p)) ? 1 : Number(p);
        if (page <= 0) page = 1;
    }
    let posts;
    try {
        posts = await prisma.posts.findMany({
            select: {
                id: true,
                author: true,
                bannerUrl: true,
                title: true,
                description: true,
                datePosted: true,
                tags: true,
            },
            where: {
                isPublished: true,
            },
            orderBy: {
                datePosted: "desc",
            },
            take: 8,
            skip: Number(page - 1) * 8,
        });
    } catch (error) {
        console.log("Error in fetching paginated posts");
        console.error(error);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }

    return res.status(200).json({
        length: posts.length,
        skip: Number(page - 1) * 8,
        data: posts,
    });
});

export default router.handler();
