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
    return res.json({
        message: "Dashbaord page",
        stats: {
            total: totalPost,
            unpublished: unpubPost,
        },
    });
});

export default router.handler();
