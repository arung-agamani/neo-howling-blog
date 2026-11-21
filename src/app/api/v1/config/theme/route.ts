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
    resetThemeConfig,
    resolveThemeConfig,
    updateThemeConfig,
} from "@/services/themeConfig";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/config/theme
 *
 * Overrides injected as CSS variables, effective values (defaults merged in),
 * and the shipped defaults. Readable by editors so the admin UI can theme
 * itself; writes are admin-only.
 */
export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        return NextResponse.json({
            success: true,
            data: await resolveThemeConfig(),
        });
    } catch (error) {
        console.error("Error fetching theme config:", error);
        return InternalServerError({
            message: "Failed to fetch theme configuration",
            error,
        });
    }
}

/** PUT /api/v1/config/theme — partial per-mode overrides; `null` clears. */
export async function PUT(req: NextRequest) {
    if (!(await verifyRole(req, ["admin"]))) {
        return Unauthorized();
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
        return BadRequest({ message: "Invalid request body" });
    }

    try {
        const resolved = await updateThemeConfig(body);
        return NextResponse.json({
            success: true,
            message: "Theme updated",
            data: resolved,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return BadRequest({
                message: "Invalid theme colours",
                errors: FlattenErrors(error),
            });
        }
        console.error("Error updating theme config:", error);
        return InternalServerError({
            message: "Failed to update theme configuration",
            error,
        });
    }
}

/** DELETE /api/v1/config/theme[?mode=light|dark] — clear overrides. */
export async function DELETE(req: NextRequest) {
    if (!(await verifyRole(req, ["admin"]))) {
        return Unauthorized();
    }

    const mode = req.nextUrl.searchParams.get("mode");
    if (mode !== null && mode !== "light" && mode !== "dark") {
        return BadRequest({
            message: "mode must be 'light' or 'dark'",
        });
    }

    try {
        const resolved = await resetThemeConfig(mode ?? undefined);
        return NextResponse.json({
            success: true,
            message: mode
                ? `Reset ${mode} colours to defaults`
                : "Reset theme colours to defaults",
            data: resolved,
        });
    } catch (error) {
        console.error("Error resetting theme config:", error);
        return InternalServerError({
            message: "Failed to reset theme configuration",
            error,
        });
    }
}
