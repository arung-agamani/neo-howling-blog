import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
    BadRequest,
    InternalServerError,
    Unauthorized,
} from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import { FlattenErrors } from "@/lib/ZodError";
import {
    EDITOR_UPLOAD_CONFIG_KEYS,
    UpdateEditorUploadConfigInput,
    resetEditorUploadConfig,
    resolveEditorUploadConfig,
    updateEditorUploadConfig,
} from "@/services/editorUploadConfig";
import type { EditorUploadConfigKey } from "@/services/editorUploadConfig";

export const dynamic = "force-dynamic";

const VALID_FIELDS: Record<string, true> = {
    enabled: true,
    folder: true,
    tags: true,
    maxBytes: true,
    allowedMimeTypes: true,
    postProcessings: true,
};

/**
 * GET /api/v1/config/editor-upload
 *
 * Resolved editor upload settings: effective config, per-key source
 * (`db` | `default`), and the env-overridable defaults.
 */
export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const resolved = await resolveEditorUploadConfig();
        return NextResponse.json({ success: true, data: resolved });
    } catch (error) {
        console.error("Error fetching editor upload config:", error);
        return InternalServerError({
            message: "Failed to fetch editor upload configuration",
            error,
        });
    }
}

/**
 * PUT /api/v1/config/editor-upload
 *
 * Partial update. Only provided fields are written; omitted fields keep
 * their stored value or fall back to the default.
 */
export async function PUT(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
        return BadRequest({ message: "Invalid request body" });
    }

    try {
        const resolved = await updateEditorUploadConfig(
            body as UpdateEditorUploadConfigInput,
        );
        return NextResponse.json({
            success: true,
            message: "Editor upload configuration updated",
            data: resolved,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return BadRequest({
                message: "Invalid editor upload configuration",
                errors: FlattenErrors(error),
            });
        }
        console.error("Error updating editor upload config:", error);
        return InternalServerError({
            message: "Failed to update editor upload configuration",
            error,
        });
    }
}

/**
 * DELETE /api/v1/config/editor-upload[?field=folder]
 *
 * Clears stored overrides so env-overridable defaults apply again.
 */
export async function DELETE(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    const field = req.nextUrl.searchParams.get("field");

    if (field !== null && !VALID_FIELDS[field]) {
        return BadRequest({
            message: `Unknown field '${field}'. Valid fields: ${Object.keys(
                EDITOR_UPLOAD_CONFIG_KEYS,
            ).join(", ")}`,
        });
    }

    try {
        const resolved = await resetEditorUploadConfig(
            field ? [field as EditorUploadConfigKey] : undefined,
        );
        return NextResponse.json({
            success: true,
            message: field
                ? `Reset '${field}' to default`
                : "Reset editor upload configuration to defaults",
            data: resolved,
        });
    } catch (error) {
        console.error("Error resetting editor upload config:", error);
        return InternalServerError({
            message: "Failed to reset editor upload configuration",
            error,
        });
    }
}
