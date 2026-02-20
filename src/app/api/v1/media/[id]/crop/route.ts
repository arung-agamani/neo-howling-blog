import {
    InternalServerError,
    Unauthorized,
    BadRequest,
    NotFound,
} from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import { assetService } from "@/services/AssetService";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FlattenErrors } from "@/lib/ZodError";

// Validation schema for crop coordinates
const CropCoordinatesSchema = z.object({
    left: z.number().min(0, "Left coordinate must be non-negative"),
    top: z.number().min(0, "Top coordinate must be non-negative"),
    width: z.number().positive("Width must be positive"),
    height: z.number().positive("Height must be positive"),
});

// Validation schema for image transforms (flip and rotation)
const ImageTransformsSchema = z.object({
    rotate: z
        .number()
        .refine(
            (val) => [0, 90, 180, 270].includes(val),
            "Rotation must be 0, 90, 180, or 270 degrees",
        ),
    flipHorizontal: z.boolean(),
    flipVertical: z.boolean(),
});

// Validation schema for the crop request
const CropImageSchema = z.object({
    variantName: z
        .string()
        .min(1, "Variant name is required")
        .max(100, "Variant name must be at most 100 characters")
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            "Variant name can only contain letters, numbers, underscores, and hyphens",
        ),
    coordinates: CropCoordinatesSchema,
    transforms: ImageTransformsSchema.optional(),
});

// POST /api/v1/media/[id]/crop - Crop an image to create a custom variant
export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const params = await props.params;
        const body = await req.json();

        const parseResult = CropImageSchema.safeParse(body);

        if (!parseResult.success) {
            return BadRequest({
                message: "Invalid crop parameters",
                errors: FlattenErrors(parseResult.error),
            });
        }

        const { variantName, coordinates, transforms } = parseResult.data;

        const variant = await assetService.createCustomCroppedVariant(
            params.id,
            {
                variantName,
                coordinates,
                transforms,
            },
        );

        // Revalidate the gallery when a "banner" variant is added to an asset
        // that already carries the "banner" tag (it now has a proper bannerUrl).
        if (variantName === "banner") {
            const asset = await assetService.getAssetById(params.id);
            if (asset?.tags?.includes("banner")) {
                revalidatePath("/gallery");
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: `Custom variant "${variantName}" created successfully`,
                data: variant,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Error cropping image:", error);

        if (error instanceof Error && error.message === "Asset not found") {
            return NotFound({ message: "Media not found" });
        }

        if (
            error instanceof Error &&
            error.message === "Asset is not an image"
        ) {
            return BadRequest({
                message: "Only images can be cropped",
            });
        }

        if (
            error instanceof Error &&
            error.message === "Asset storage key not found"
        ) {
            return BadRequest({
                message: "Asset storage key not found",
            });
        }

        return InternalServerError({
            message:
                error instanceof Error ? error.message : "Failed to crop image",
        });
    }
}
