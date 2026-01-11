import {
    InternalServerError,
    Unauthorized,
} from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import { assetService } from "@/services/AssetService";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// GET /api/v1/media/stats - Get media statistics
export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        const searchParams = req.nextUrl.searchParams;
        const uploaderId = searchParams.get("uploaderId");

        // If no uploaderId specified and user is not admin, show only their stats
        const finalUploaderId =
            uploaderId || (token?.role !== "admin" ? token?.sub : undefined);

        const stats = await assetService.getAssetStats(finalUploaderId);

        return NextResponse.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error("Error fetching media statistics:", error);
        return InternalServerError({
            message: error instanceof Error ? error.message : "Failed to fetch statistics",
        });
    }
}
