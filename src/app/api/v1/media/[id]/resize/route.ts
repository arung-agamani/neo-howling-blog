import {
    InternalServerError,
    Unauthorized,
    BadRequest,
    NotFound,
} from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import { assetService } from "@/services/AssetService";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FlattenErrors } from "@/lib/ZodError";

// Validation schemas
const ResizeImageSchema = z.object({
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    fit: z.enum(["cover", "contain", "fill", "inside", "outside"]).optional().default("inside"),
}).refine(data => data.width !== undefined || data.height !== undefined, {
    message: "At least one of width or height must be provided",
});

// POST /api/v1/media/[id]/resize - Resize an image asset
export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const params = await props.params;
        const body = await req.json();

        const parseResult = ResizeImageSchema.safeParse(body);

        if (!parseResult.success) {
            return BadRequest({
                message: "Invalid resize parameters",
                errors: FlattenErrors(parseResult.error),
            });
        }

        const { width, height, fit } = parseResult.data;

        const asset = await assetService.resizeImageAsset(
            params.id,
            width,
            height,
            fit
        );

        return NextResponse.json({
            success: true,
            message: "Image resized successfully",
            data: asset,
        });
    } catch (error) {
        console.error("Error resizing image:", error);

        if (error instanceof Error && error.message === "Asset not found") {
            return NotFound({ message: "Media not found" });
        }

        if (error instanceof Error && error.message === "Asset is not an image") {
            return BadRequest({ message: "Only images can be resized" });
        }

        return InternalServerError({
            message: error instanceof Error ? error.message : "Failed to resize image",
        });
    }
}
