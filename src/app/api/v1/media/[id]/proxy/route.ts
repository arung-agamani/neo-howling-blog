import {
    InternalServerError,
    Unauthorized,
    NotFound,
} from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import { assetService } from "@/services/AssetService";
import { NextRequest, NextResponse } from "next/server";

// GET /api/v1/media/[id]/proxy - Proxy image to bypass CORS for cropper
export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const params = await props.params;

        // Get the asset
        const asset = await assetService.getAssetById(params.id);
        if (!asset) {
            return NotFound({ message: "Media not found" });
        }

        // Only allow images
        if (asset.type !== "Image") {
            return NotFound({ message: "Only images can be proxied" });
        }

        // Fetch the image from CDN
        const imageResponse = await fetch(asset.url);

        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();

        // Return the image with proper headers
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                "Content-Type": asset.mimeType,
                "Content-Length": asset.fileSize.toString(),
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
            },
        });
    } catch (error) {
        console.error("Error proxying image:", error);

        return InternalServerError({
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to proxy image",
        });
    }
}
