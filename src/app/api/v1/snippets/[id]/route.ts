import { NextRequest, NextResponse } from "next/server";
import { GetSnippet } from "@/lib/Snippet";
import { BadRequest, NotFound } from "@/app/api/responses";

export const dynamic = "force-dynamic";

// GET /api/v1/snippets/[id] (get snippet by id)
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    if (!id) return BadRequest();
    const snippet = await GetSnippet(id);
    if (!snippet) return NotFound();
    return NextResponse.json(snippet);
}
