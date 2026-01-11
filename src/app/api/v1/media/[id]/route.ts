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
const UpdateMediaSchema = z.object({
    title: z.string().optional(),
    slug: z.string().optional(),
    altText: z.string().optional(),
    caption: z.string().optional(),
    description: z.string().optional(),
    folder: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

// GET /api/v1/media/[id] - Get media by ID
export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const params = await props.params;
        const asset = await assetService.getAssetById(params.id);

        if (!asset) {
            return NotFound({ message: "Media not found" });
        }

        return NextResponse.json({
            success: true,
            data: asset,
        });
    } catch (error) {
        console.error("Error fetching media:", error);
        return InternalServerError({
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch media",
        });
    }
}

// PATCH /api/v1/media/[id] - Update media metadata
export async function PATCH(
    req: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const params = await props.params;
        const body = await req.json();

        const parseResult = UpdateMediaSchema.safeParse(body);

        if (!parseResult.success) {
            return BadRequest({
                message: "Invalid update parameters",
                errors: FlattenErrors(parseResult.error),
            });
        }

        const asset = await assetService.updateAssetMetadata(
            params.id,
            parseResult.data,
        );

        return NextResponse.json({
            success: true,
            message: "Media updated successfully",
            data: asset,
        });
    } catch (error) {
        console.error("Error updating media:", error);

        if (error instanceof Error && error.message === "Asset not found") {
            return NotFound({ message: "Media not found" });
        }

        if (error instanceof Error && error.message === "Slug already exists") {
            return BadRequest({ message: "Slug already exists" });
        }

        return InternalServerError({
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to update media",
        });
    }
}

// DELETE /api/v1/media/[id] - Delete media (soft or permanent)
export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const params = await props.params;
        const searchParams = req.nextUrl.searchParams;
        const permanent = searchParams.get("permanent") === "true";

        await assetService.deleteAsset(params.id, permanent);

        return NextResponse.json({
            success: true,
            message: permanent
                ? "Media permanently deleted"
                : "Media moved to trash",
        });
    } catch (error) {
        console.error("Error deleting media:", error);

        if (error instanceof Error && error.message === "Asset not found") {
            return NotFound({ message: "Media not found" });
        }

        return InternalServerError({
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to delete media",
        });
    }
}
