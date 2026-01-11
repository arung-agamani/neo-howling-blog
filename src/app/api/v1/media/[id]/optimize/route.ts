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
const OptimizeImageSchema = z.object({
    quality: z.number().min(1).max(100).optional(),
});

// POST /api/v1/media/[id]/optimize - Optimize/compress an image asset
export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const params = await props.params;
        const body = await req.json().catch(() => ({}));

        const parseResult = OptimizeImageSchema.safeParse(body);

        if (!parseResult.success) {
            return BadRequest({
                message: "Invalid optimization parameters",
                errors: FlattenErrors(parseResult.error),
            });
        }

        const { quality } = parseResult.data;

        const asset = await assetService.optimizeImageAsset(
            params.id,
            quality
        );

        return NextResponse.json({
            success: true,
            message: "Image optimized successfully",
            data: asset,
        });
    } catch (error) {
        console.error("Error optimizing image:", error);

        if (error instanceof Error && error.message === "Asset not found") {
            return NotFound({ message: "Media not found" });
        }

        if (error instanceof Error && error.message === "Asset is not an image") {
            return BadRequest({ message: "Only images can be optimized" });
        }

        return InternalServerError({
            message: error instanceof Error ? error.message : "Failed to optimize image",
        });
    }
}
