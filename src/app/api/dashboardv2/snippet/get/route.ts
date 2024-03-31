import { BadRequest, NotFound } from "@/app/api/responses";
import { GetSnippet } from "@/lib/Snippet";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) return BadRequest();

    const snippet = await GetSnippet(id);
    if (!snippet) return NotFound();

    return NextResponse.json(snippet);
}
