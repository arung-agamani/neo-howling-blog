import { BadRequest, NotFound } from "@/app/api/responses";
import { GetPost } from "@/lib/Post";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) return BadRequest();

    const post = await GetPost(id);
    if (!post) return NotFound();

    return NextResponse.json(post);
}
