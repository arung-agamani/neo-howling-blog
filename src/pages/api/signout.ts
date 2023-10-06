import prisma from "@/utils/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
const router = createRouter<NextApiRequest, NextApiResponse>();

router.post(async (req, res) => {
    return res
        .status(302)
        .setHeader(
            "set-cookie",
            `token=asdf; path=/; samesite=lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        )
        .setHeader("location", "/dashboard")
        .end();
});

export default router.handler();
