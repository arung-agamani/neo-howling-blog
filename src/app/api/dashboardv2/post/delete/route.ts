import { BadRequest, InternalServerError } from "@/app/api/responses";
import { DeletePost } from "@/lib/Post";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) return BadRequest();

    const deleteRes = await DeletePost(id);
    if (!deleteRes) return InternalServerError();

    return NextResponse.json({ message: "Post marked as deleted" });
}
