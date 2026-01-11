import {
    InternalServerError,
    Unauthorized,
    BadRequest,
    NotFound,
} from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import { assetService } from "@/services/AssetService";
import { IMAGE_SIZE_PRESETS } from "@/services/ImageService";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FlattenErrors } from "@/lib/ZodError";

// Validation schemas
const GenerateVariantsSchema = z.object({
    presets: z.array(
        z.enum(["thumbnail", "medium", "medium_large", "large", "2048x2048"])
    ).optional(),
});

// GET /api/v1/media/[id]/variants - List all variants for a media item
export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const params = await props.params;

        // Check if asset exists
        const asset = await assetService.getAssetById(params.id);
        if (!asset) {
            return NotFound({ message: "Media not found" });
        }

        const variants = await assetService.getAssetVariants(params.id);

        return NextResponse.json({
            success: true,
            data: variants,
        });
    } catch (error) {
        console.error("Error fetching variants:", error);
        return InternalServerError({
            message: error instanceof Error ? error.message : "Failed to fetch variants",
        });
    }
}

// POST /api/v1/media/[id]/variants - Generate variants for an image
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

        const parseResult = GenerateVariantsSchema.safeParse(body);

        if (!parseResult.success) {
            return BadRequest({
                message: "Invalid parameters",
                errors: FlattenErrors(parseResult.error),
            });
        }

        const presets = parseResult.data.presets || ["thumbnail", "medium", "large"];

        const variants = await assetService.generateImageVariantsForAsset(
            params.id,
            presets as (keyof typeof IMAGE_SIZE_PRESETS)[]
        );

        return NextResponse.json(
            {
                success: true,
                message: "Variants generated successfully",
                data: variants,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error generating variants:", error);

        if (error instanceof Error && error.message === "Asset not found") {
            return NotFound({ message: "Media not found" });
        }

        if (error instanceof Error && error.message === "Asset is not an image") {
            return BadRequest({ message: "Only images can have variants generated" });
        }

        return InternalServerError({
            message: error instanceof Error ? error.message : "Failed to generate variants",
        });
    }
}
