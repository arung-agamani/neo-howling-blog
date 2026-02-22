import { verifyRole } from "@/hooks/useRoleAuth";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { Unauthorized, BadRequest } from "../../responses";

/**
 * POST /api/v1/revalidate
 *
 * Triggers on-demand revalidation for one or more Next.js cached paths.
 * Body: { paths: string[] }
 *
 * Requires admin or editor role.
 */
export async function POST(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    const body = await req.json().catch(() => null);
    const paths: unknown = body?.paths;

    if (!Array.isArray(paths) || paths.length === 0) {
        return BadRequest({ message: "Body must contain a non-empty 'paths' array" });
    }

    for (const path of paths) {
        if (typeof path === "string") {
            revalidatePath(path);
        }
    }

    return NextResponse.json({
        success: true,
        message: `Revalidated ${paths.length} path(s)`,
        paths,
    });
}
