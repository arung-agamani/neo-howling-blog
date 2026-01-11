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
const ConvertImageSchema = z.object({
    format: z.enum(["jpeg", "png", "webp", "avif"]),
    quality: z.number().min(1).max(100).optional(),
});

// POST /api/v1/media/[id]/convert - Convert image format
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

        const parseResult = ConvertImageSchema.safeParse(body);

        if (!parseResult.success) {
            return BadRequest({
                message: "Invalid conversion parameters",
                errors: FlattenErrors(parseResult.error),
            });
        }

        const { format, quality } = parseResult.data;

        const asset = await assetService.convertImageFormat(
            params.id,
            format,
            quality
        );

        return NextResponse.json({
            success: true,
            message: `Image converted to ${format} successfully`,
            data: asset,
        });
    } catch (error) {
        console.error("Error converting image:", error);

        if (error instanceof Error && error.message === "Asset not found") {
            return NotFound({ message: "Media not found" });
        }

        if (error instanceof Error && error.message === "Asset is not an image") {
            return BadRequest({ message: "Only images can be converted" });
        }

        return InternalServerError({
            message: error instanceof Error ? error.message : "Failed to convert image",
        });
    }
}
