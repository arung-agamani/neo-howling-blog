import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { BadRequest } from "@/app/api/responses";

// GET /api/v1/tags/[name] (get tag detail and related posts)
export async function GET(req: NextRequest, props: { params: Promise<{ name: string }> }) {
    const params = await props.params;
    const name = params.name;
    if (!name) return BadRequest();
    const posts = await prisma.posts.findMany({
        where: { tags: { has: name } },
        select: { id: true, title: true },
        orderBy: { datePosted: "desc" },
    });
    const tag = await prisma.tags.findFirst({ where: { name } });
    const payload = { ...tag, posts };
    return NextResponse.json(payload);
}
