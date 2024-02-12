import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/prisma";

interface ReturnBody {
    message: string;
    body: any;
}

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const returnBody: ReturnBody = {
        message: "Failed",
        body: "Failed to fetch data.",
    };
    try {
        const result = await prisma.posts.findMany({
            select: {
                title: true,
                link: true,
                tags: true,
                description: true,
                bannerUrl: true,
                isBannerDark: true,
            },
        });
        returnBody.body = result;
        returnBody.message = "Success! ";
    } catch (error) {
        returnBody.message = `Failed to fetch data: ${JSON.stringify(error)}`;
    }
    return res.status(200).json(returnBody);
}
