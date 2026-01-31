import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { z } from "zod";

// Validation schema for creating a tag
const CreateTagSchema = z.object({
    name: z
        .string()
        .min(1, "Tag name is required")
        .max(50, "Tag name must be 50 characters or less")
        .transform((val) => val.trim().toLowerCase()),
    description: z.string().max(500).optional(),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
        .optional(),
    aliases: z.array(z.string()).optional(),
});

// GET /api/v1/tags (list all tags with optional stats)
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const includeStats = searchParams.get("stats") === "true";
        const search = searchParams.get("search")?.toLowerCase();
        const status = searchParams.get("status"); // "all" | "active" | "orphaned"
        const sortBy = searchParams.get("sortBy") || "count"; // "count" | "name" | "createdAt"
        const sortOrder = searchParams.get("sortOrder") || "desc"; // "asc" | "desc"
        const limit = parseInt(searchParams.get("limit") || "100", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        // Build where clause
        const whereClause: any = {};

        // Search filter
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { aliases: { hasSome: [search] } },
            ];
        }

        // Status filter
        if (status === "orphaned") {
            whereClause.count = 0;
        } else if (status === "active") {
            whereClause.count = { gt: 0 };
        }

        // Build orderBy
        const orderBy: any = {};
        if (sortBy === "name") {
            orderBy.name = sortOrder;
        } else if (sortBy === "createdAt") {
            orderBy.id = sortOrder; // MongoDB ObjectId contains timestamp
        } else {
            orderBy.count = sortOrder;
        }

        // Fetch tags with pagination
        const [tags, totalCount] = await Promise.all([
            prisma.tags.findMany({
                where: whereClause,
                orderBy,
                take: limit,
                skip: offset,
            }),
            prisma.tags.count({ where: whereClause }),
        ]);

        // If stats are requested, calculate additional metrics
        if (includeStats) {
            const [totalTags, activeTags, orphanedTags] = await Promise.all([
                prisma.tags.count(),
                prisma.tags.count({ where: { count: { gt: 0 } } }),
                prisma.tags.count({ where: { count: 0 } }),
            ]);

            // Get top tags by count
            const topTags = await prisma.tags.findMany({
                orderBy: { count: "desc" },
                take: 10,
                select: { name: true, count: true },
            });

            return NextResponse.json({
                tags,
                pagination: {
                    total: totalCount,
                    limit,
                    offset,
                    hasMore: offset + tags.length < totalCount,
                },
                stats: {
                    total: totalTags,
                    active: activeTags,
                    orphaned: orphanedTags,
                    topTags,
                },
            });
        }

        return NextResponse.json(tags);
    } catch (error) {
        console.error("Error fetching tags:", error);
        return NextResponse.json(
            { error: "Failed to fetch tags" },
            { status: 500 },
        );
    }
}

// POST /api/v1/tags (create a new tag)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate request body
        const parseResult = CreateTagSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: parseResult.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const { name, description, color, aliases } = parseResult.data;

        // Check if tag already exists
        const existingTag = await prisma.tags.findUnique({
            where: { name },
        });

        if (existingTag) {
            return NextResponse.json(
                { error: "A tag with this name already exists" },
                { status: 409 },
            );
        }

        // Check if any alias conflicts with existing tag names
        if (aliases && aliases.length > 0) {
            const normalizedAliases = aliases.map((a) =>
                a.trim().toLowerCase(),
            );
            const conflictingTags = await prisma.tags.findMany({
                where: {
                    OR: [
                        { name: { in: normalizedAliases } },
                        { aliases: { hasSome: normalizedAliases } },
                    ],
                },
            });

            if (conflictingTags.length > 0) {
                return NextResponse.json(
                    {
                        error: "One or more aliases conflict with existing tags",
                        conflicts: conflictingTags.map((t) => t.name),
                    },
                    { status: 409 },
                );
            }
        }

        // Create the tag
        const newTag = await prisma.tags.create({
            data: {
                name,
                description: description || null,
                color: color || null,
                aliases: aliases?.map((a) => a.trim().toLowerCase()) || [],
                count: 0,
                posts: [],
            },
        });

        return NextResponse.json(newTag, { status: 201 });
    } catch (error) {
        console.error("Error creating tag:", error);
        return NextResponse.json(
            { error: "Failed to create tag" },
            { status: 500 },
        );
    }
}
