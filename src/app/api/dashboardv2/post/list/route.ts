import { ListPosts } from "@/lib/Post";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const posts = await ListPosts();
    return NextResponse.json(posts);
}
