import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { BadRequest } from "@/app/api/responses";
import { z } from "zod";

// Validation schema for updating a tag
const UpdateTagSchema = z.object({
    name: z
        .string()
        .min(1, "Tag name is required")
        .max(50, "Tag name must be 50 characters or less")
        .transform((val) => val.trim().toLowerCase())
        .optional(),
    description: z.string().max(500).nullable().optional(),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
        .nullable()
        .optional(),
    aliases: z.array(z.string()).optional(),
});

// GET /api/v1/tags/[name] (get tag detail and related posts)
export async function GET(
    req: NextRequest,
    props: { params: Promise<{ name: string }> },
) {
    const params = await props.params;
    const name = decodeURIComponent(params.name).toLowerCase();

    if (!name) return BadRequest({ message: "Tag name is required" });

    try {
        const tag = await prisma.tags.findFirst({ where: { name } });

        if (!tag) {
            return NextResponse.json(
                { error: "Tag not found" },
                { status: 404 },
            );
        }

        // Get detailed post information
        const posts = await prisma.posts.findMany({
            where: { tags: { has: name } },
            select: {
                id: true,
                title: true,
                description: true,
                datePosted: true,
                updatedAt: true,
                isPublished: true,
                deleted: true,
                tags: true,
            },
            orderBy: { datePosted: "desc" },
        });

        // Get related tags (tags that often appear together with this tag)
        const relatedTagsMap: Record<string, number> = {};
        posts.forEach((post) => {
            post.tags.forEach((t) => {
                if (t.toLowerCase() !== name) {
                    const normalizedTag = t.toLowerCase();
                    relatedTagsMap[normalizedTag] =
                        (relatedTagsMap[normalizedTag] || 0) + 1;
                }
            });
        });

        const relatedTags = Object.entries(relatedTagsMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tagName, count]) => ({
                name: tagName,
                coOccurrences: count,
            }));

        // Calculate stats
        const publishedCount = posts.filter(
            (p) => p.isPublished && !p.deleted,
        ).length;
        const draftCount = posts.filter(
            (p) => !p.isPublished && !p.deleted,
        ).length;
        const deletedCount = posts.filter((p) => p.deleted).length;

        const payload = {
            ...tag,
            posts: posts.filter((p) => !p.deleted), // Exclude deleted posts from list
            relatedTags,
            stats: {
                totalPosts: tag.count,
                publishedPosts: publishedCount,
                draftPosts: draftCount,
                deletedPosts: deletedCount,
            },
        };

        return NextResponse.json(payload);
    } catch (error) {
        console.error("Error fetching tag:", error);
        return NextResponse.json(
            { error: "Failed to fetch tag details" },
            { status: 500 },
        );
    }
}

// PUT /api/v1/tags/[name] (update a tag, including rename)
export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ name: string }> },
) {
    const params = await props.params;
    const currentName = decodeURIComponent(params.name).toLowerCase();

    if (!currentName) return BadRequest({ message: "Tag name is required" });

    try {
        const body = await req.json();

        // Validate request body
        const parseResult = UpdateTagSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: parseResult.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const { name: newName, description, color, aliases } = parseResult.data;

        // Find the existing tag
        const existingTag = await prisma.tags.findFirst({
            where: { name: currentName },
        });

        if (!existingTag) {
            return NextResponse.json(
                { error: "Tag not found" },
                { status: 404 },
            );
        }

        // If renaming, check if new name already exists
        if (newName && newName !== currentName) {
            const conflictingTag = await prisma.tags.findFirst({
                where: { name: newName },
            });

            if (conflictingTag) {
                return NextResponse.json(
                    {
                        error: "A tag with this name already exists",
                        suggestion: "Consider merging the tags instead",
                    },
                    { status: 409 },
                );
            }
        }

        // Check alias conflicts
        if (aliases && aliases.length > 0) {
            const normalizedAliases = aliases.map((a) =>
                a.trim().toLowerCase(),
            );
            const conflictingTags = await prisma.tags.findMany({
                where: {
                    AND: [
                        { id: { not: existingTag.id } },
                        {
                            OR: [
                                { name: { in: normalizedAliases } },
                                { aliases: { hasSome: normalizedAliases } },
                            ],
                        },
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

        // Prepare update data
        const updateData: any = {};
        if (newName !== undefined) updateData.name = newName;
        if (description !== undefined) updateData.description = description;
        if (color !== undefined) updateData.color = color;
        if (aliases !== undefined)
            updateData.aliases = aliases.map((a) => a.trim().toLowerCase());

        // If renaming, also update all posts that have this tag
        if (newName && newName !== currentName) {
            // Find all posts with the old tag name
            const postsWithTag = await prisma.posts.findMany({
                where: { tags: { has: currentName } },
                select: { id: true, tags: true },
            });

            // Update each post's tags array
            const postUpdates = postsWithTag.map((post) => {
                const updatedTags = post.tags.map((t) =>
                    t.toLowerCase() === currentName ? newName : t,
                );
                return prisma.posts.update({
                    where: { id: post.id },
                    data: { tags: updatedTags },
                });
            });

            // Also update the posts array in the tag to reflect any changes
            updateData.posts = postsWithTag.map((p) => p.id);

            // Execute all updates in a transaction
            await prisma.$transaction([
                ...postUpdates,
                prisma.tags.update({
                    where: { id: existingTag.id },
                    data: updateData,
                }),
            ]);

            const updatedTag = await prisma.tags.findUnique({
                where: { id: existingTag.id },
            });

            return NextResponse.json({
                tag: updatedTag,
                postsUpdated: postsWithTag.length,
                message: `Tag renamed from "${currentName}" to "${newName}" and ${postsWithTag.length} posts updated`,
            });
        } else {
            // Simple update without rename
            const updatedTag = await prisma.tags.update({
                where: { id: existingTag.id },
                data: updateData,
            });

            return NextResponse.json({
                tag: updatedTag,
                message: "Tag updated successfully",
            });
        }
    } catch (error) {
        console.error("Error updating tag:", error);
        return NextResponse.json(
            { error: "Failed to update tag" },
            { status: 500 },
        );
    }
}

// DELETE /api/v1/tags/[name] (delete a tag)
export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ name: string }> },
) {
    const params = await props.params;
    const name = decodeURIComponent(params.name).toLowerCase();

    if (!name) return BadRequest({ message: "Tag name is required" });

    try {
        const searchParams = req.nextUrl.searchParams;
        const removeFromPosts = searchParams.get("removeFromPosts") === "true";

        // Find the existing tag
        const existingTag = await prisma.tags.findFirst({
            where: { name },
        });

        if (!existingTag) {
            return NextResponse.json(
                { error: "Tag not found" },
                { status: 404 },
            );
        }

        let postsUpdated = 0;

        if (removeFromPosts) {
            // Find all posts with this tag and remove it
            const postsWithTag = await prisma.posts.findMany({
                where: { tags: { has: name } },
                select: { id: true, tags: true },
            });

            // Update each post's tags array to remove this tag
            const postUpdates = postsWithTag.map((post) => {
                const updatedTags = post.tags.filter(
                    (t) => t.toLowerCase() !== name,
                );
                return prisma.posts.update({
                    where: { id: post.id },
                    data: { tags: updatedTags },
                });
            });

            await prisma.$transaction(postUpdates);
            postsUpdated = postsWithTag.length;
        }

        // Delete the tag
        await prisma.tags.delete({
            where: { id: existingTag.id },
        });

        return NextResponse.json({
            message: "Tag deleted successfully",
            tagName: name,
            postsUpdated: removeFromPosts ? postsUpdated : 0,
        });
    } catch (error) {
        console.error("Error deleting tag:", error);
        return NextResponse.json(
            { error: "Failed to delete tag" },
            { status: 500 },
        );
    }
}
