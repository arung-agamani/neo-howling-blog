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

// Validation schema for process request
const ProcessUploadSchema = z.object({
    generateVariants: z.boolean().optional().default(false),
});

// POST /api/v1/media/[id]/process - Process an uploaded asset
// Called after frontend uploads file directly to S3 via presigned URL
export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> },
) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const params = await props.params;
        const body = await req.json().catch(() => ({}));

        const parseResult = ProcessUploadSchema.safeParse(body);

        if (!parseResult.success) {
            return BadRequest({
                message: "Invalid process parameters",
                errors: FlattenErrors(parseResult.error),
            });
        }

        const { generateVariants } = parseResult.data;

        // Process the uploaded asset
        const asset = await assetService.processUpload(params.id, {
            generateVariants,
        });

        if (!asset) {
            return NotFound({ message: "Asset not found" });
        }

        return NextResponse.json({
            success: true,
            message: "Asset processed successfully",
            data: asset,
        });
    } catch (error) {
        console.error("Error processing upload:", error);

        if (error instanceof Error && error.message === "Asset not found") {
            return NotFound({ message: "Asset not found" });
        }

        if (
            error instanceof Error &&
            error.message.includes("Invalid asset status")
        ) {
            return BadRequest({ message: error.message });
        }

        if (
            error instanceof Error &&
            error.message.includes("File not found in storage")
        ) {
            return BadRequest({
                message:
                    "File not found in storage. Please ensure the file was uploaded successfully before processing.",
            });
        }

        return InternalServerError({
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to process upload",
        });
    }
}
