import { NextRequest, NextResponse } from "next/server";
import { ListSnippets } from "@/lib/Snippet";
import { verifyRole } from "@/hooks/useRoleAuth";
import { Unauthorized } from "@/app/api/responses";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }
    const snippets = await ListSnippets();
    return NextResponse.json(snippets);
}