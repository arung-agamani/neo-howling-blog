import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/prisma";
import { Prisma } from "@prisma/client";
import highlight from "highlight.js/lib/common";

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id, h } = req.query;
    if (!id) return res.status(400).json({ message: "No id given" });
    try {
        let result;
        if (!Array.isArray(h) && h === "1") {
            result = await prisma.posts.findFirstOrThrow({
                select: {
                    title: true,
                    link: true,
                    tags: true,
                    description: true,
                    bannerUrl: true,
                },
                where: {
                    id: id as string,
                },
            });
        } else {
            result = await prisma.posts.findFirstOrThrow({
                select: {
                    title: true,
                    link: true,
                    tags: true,
                    description: true,
                    bannerUrl: true,
                    isBannerDark: true,
                    blogContent: true,
                },
                where: {
                    id: id as string,
                },
            });
            // result.blogContent = highlight.highlightAuto(
            //     result.blogContent
            // ).value;
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                return res
                    .status(404)
                    .json({ message: "Post with given ID not found" });
            } else {
                return res
                    .status(500)
                    .json({ message: "Internal Server Error" });
            }
        } else {
            console.error("Not a PrismaClientKnownRequestError instance.");
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
}
