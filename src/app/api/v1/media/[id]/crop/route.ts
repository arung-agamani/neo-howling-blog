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

// Validation schema for crop coordinates
const CropCoordinatesSchema = z.object({
    left: z.number().min(0, "Left coordinate must be non-negative"),
    top: z.number().min(0, "Top coordinate must be non-negative"),
    width: z.number().positive("Width must be positive"),
    height: z.number().positive("Height must be positive"),
});

// Validation schema for the crop request
const CropImageSchema = z.object({
    variantName: z
        .string()
        .min(1, "Variant name is required")
        .max(100, "Variant name must be at most 100 characters")
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            "Variant name can only contain letters, numbers, underscores, and hyphens"
        ),
    coordinates: CropCoordinatesSchema,
});

// POST /api/v1/media/[id]/crop - Crop an image to create a custom variant
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

        const parseResult = CropImageSchema.safeParse(body);

        if (!parseResult.success) {
            return BadRequest({
                message: "Invalid crop parameters",
                errors: FlattenErrors(parseResult.error),
            });
        }

        const { variantName, coordinates } = parseResult.data;

        const variant = await assetService.createCustomCroppedVariant(
            params.id,
            {
                variantName,
                coordinates,
            }
        );

        return NextResponse.json(
            {
                success: true,
                message: `Custom variant "${variantName}" created successfully`,
                data: variant,
            },
            { status: 201 }
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
                error instanceof Error
                    ? error.message
                    : "Failed to crop image",
        });
    }
}
