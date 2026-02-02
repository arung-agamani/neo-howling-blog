import { verifyRole } from "@/hooks/useRoleAuth";
import prisma from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
    InternalServerError,
    Unauthorized,
} from "@/app/api/responses";

/**
 * Configuration key for autosave interval
 */
const AUTOSAVE_CONFIG_KEY = "editor.autosave.interval.ms";

/**
 * Default autosave interval in milliseconds (30 seconds)
 */
const DEFAULT_AUTOSAVE_INTERVAL = "30000";

/**
 * Default description for the autosave config
 */
const DEFAULT_AUTOSAVE_DESCRIPTION =
    "Autosave interval in milliseconds for the post editor. The editor will automatically save drafts after this period of inactivity.";

/**
 * GET /api/v1/config/autosave
 *
 * Fetches the autosave configuration.
 * If the config doesn't exist, it will be auto-created with the default value.
 */
export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        // Try to find existing config
        let config = await prisma.config.findUnique({
            where: { key: AUTOSAVE_CONFIG_KEY },
        });

        // If config doesn't exist, create it with default value
        if (!config) {
            config = await prisma.config.create({
                data: {
                    key: AUTOSAVE_CONFIG_KEY,
                    value: DEFAULT_AUTOSAVE_INTERVAL,
                    description: DEFAULT_AUTOSAVE_DESCRIPTION,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: config,
        });
    } catch (error) {
        console.error("Error fetching autosave config:", error);
        return InternalServerError({
            message: "Failed to fetch autosave configuration",
            error,
        });
    }
}

/**
 * PUT /api/v1/config/autosave
 *
 * Updates the autosave configuration.
 * Validates that the value is a positive integer.
 */
export async function PUT(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const body = await req.json();
        const { value } = body;

        // Validate the value is a positive integer
        const interval = parseInt(value, 10);
        if (isNaN(interval) || interval <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Value must be a positive integer (milliseconds)",
                },
                { status: 400 }
            );
        }

        // Upsert the config
        const config = await prisma.config.upsert({
            where: { key: AUTOSAVE_CONFIG_KEY },
            update: {
                value: interval.toString(),
            },
            create: {
                key: AUTOSAVE_CONFIG_KEY,
                value: interval.toString(),
                description: DEFAULT_AUTOSAVE_DESCRIPTION,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Autosave configuration updated",
            data: config,
        });
    } catch (error) {
        console.error("Error updating autosave config:", error);
        return InternalServerError({
            message: "Failed to update autosave configuration",
            error,
        });
    }
}
