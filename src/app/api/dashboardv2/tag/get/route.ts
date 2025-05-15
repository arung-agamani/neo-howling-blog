import { BadRequest } from "@/app/api/responses";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const name = searchParams.get("name");
    if (!name) return BadRequest();

    const posts = await prisma.posts.findMany({
        where: {
            tags: {
                has: name,
            },
        },
        select: {
            id: true,
            title: true,
        },
        orderBy: {
            datePosted: "desc",
        },
    });

    const tag = await prisma.tags.findFirst({ where: { name } });
    const payload = {
        ...tag,
        posts,
    };

    return NextResponse.json(payload);
}
