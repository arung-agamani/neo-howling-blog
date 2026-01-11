import {
    InternalServerError,
    Unauthorized,
    BadRequest,
} from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import { assetService } from "@/services/AssetService";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FlattenErrors } from "@/lib/ZodError";
import { getToken } from "next-auth/jwt";

// Validation schemas
const ListMediaQuerySchema = z.object({
    type: z
        .enum(["Image", "Video", "Audio", "Document", "Archive", "Other"])
        .nullable()
        .optional(),
    folder: z.string().nullable().optional(),
    tags: z.string().nullable().optional(), // Comma-separated tags
    search: z.string().nullable().optional(),
    limit: z.coerce.number().min(1).max(100).optional().default(20),
    offset: z.coerce.number().min(0).optional().default(0),
    orderBy: z
        .enum(["uploadedAt", "filename", "fileSize", "usageCount"])
        .optional()
        .default("uploadedAt"),
    orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
    includeDeleted: z.coerce.boolean().optional().default(false),
});

const UploadMediaSchema = z.object({
    filename: z.string().min(1),
    mimeType: z.string().min(1),
    fileSize: z.number().positive(),
    title: z.string().optional(),
    altText: z.string().optional(),
    caption: z.string().optional(),
    description: z.string().optional(),
    folder: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    generateVariants: z.boolean().optional().default(false),
});

// GET /api/v1/media - List media with filtering and pagination
export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const searchParams = req.nextUrl.searchParams;
        const queryParams = {
            type: searchParams.get("type"),
            folder: searchParams.get("folder"),
            tags: searchParams.get("tags"),
            search: searchParams.get("search"),
            limit: searchParams.get("limit"),
            offset: searchParams.get("offset"),
            orderBy: searchParams.get("orderBy"),
            orderDirection: searchParams.get("orderDirection"),
            includeDeleted: searchParams.get("includeDeleted"),
        };

        const parseResult = ListMediaQuerySchema.safeParse(queryParams);

        if (!parseResult.success) {
            return BadRequest({
                message: "Invalid query parameters",
                errors: FlattenErrors(parseResult.error),
            });
        }

        const { tags, type, folder, search, ...rest } = parseResult.data;

        const result = await assetService.listAssets({
            ...rest,
            type: type || undefined,
            folder: folder || undefined,
            search: search || undefined,
            tags: tags ? tags.split(",").map((t) => t.trim()) : undefined,
        });

        return NextResponse.json({
            success: true,
            data: result.assets,
            pagination: {
                total: result.total,
                limit: result.limit,
                offset: result.offset,
                hasMore: result.hasMore,
            },
        });
    } catch (error) {
        console.error("Error listing media:", error);
        return InternalServerError({
            message:
                error instanceof Error ? error.message : "Failed to list media",
        });
    }
}

// POST /api/v1/media - Upload media with metadata
export async function POST(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });
        if (!token?.sub) {
            return Unauthorized({ message: "User ID not found in token" });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return BadRequest({ message: "No file provided" });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse metadata from form data
        const title = formData.get("title")?.toString();
        const originalFilename = file.name;

        // Generate filename with timestamp prefix and title-based name
        const timestamp = Date.now();
        const fileExtension = originalFilename.includes(".")
            ? originalFilename.substring(originalFilename.lastIndexOf("."))
            : "";

        // Sanitize title for use as filename
        const sanitizeForFilename = (str: string): string => {
            return str
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .substring(0, 50); // Limit length
        };

        // Use title if provided, otherwise use original filename
        const baseFilename = title
            ? sanitizeForFilename(title)
            : originalFilename
                  .replace(fileExtension, "")
                  .replace(/[^a-z0-9]+/gi, "-")
                  .toLowerCase();

        // Construct new filename: timestamp-basename.ext
        const newFilename = `${timestamp}-${baseFilename}${fileExtension}`;

        const metadata = {
            filename: newFilename,
            mimeType: file.type,
            fileSize: file.size,
            title: title,
            altText: formData.get("altText")?.toString(),
            caption: formData.get("caption")?.toString(),
            description: formData.get("description")?.toString(),
            folder: formData.get("folder")?.toString(),
            tags: formData.get("tags")
                ? JSON.parse(formData.get("tags") as string)
                : undefined,
            metadata: formData.get("metadata")
                ? JSON.parse(formData.get("metadata") as string)
                : undefined,
            generateVariants: formData.get("generateVariants") === "true",
        };

        const parseResult = UploadMediaSchema.safeParse(metadata);

        if (!parseResult.success) {
            return BadRequest({
                message: "Invalid upload parameters",
                errors: FlattenErrors(parseResult.error),
            });
        }

        const { filename, mimeType, generateVariants, ...uploadParams } =
            parseResult.data;

        const asset = await assetService.uploadAsset({
            file: buffer,
            filename,
            mimeType,
            uploaderId: token.sub,
            generateVariants,
            ...uploadParams,
        });

        return NextResponse.json(
            {
                success: true,
                message: "Media uploaded successfully",
                data: asset,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Error uploading media:", error);
        return InternalServerError({
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to upload media",
        });
    }
}
