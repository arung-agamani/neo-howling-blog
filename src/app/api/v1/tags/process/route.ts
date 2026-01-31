import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// POST /api/v1/tags/process (recalculate tags and optionally cleanup orphaned tags)
export async function POST(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const cleanupOrphaned = searchParams.get("cleanupOrphaned") === "true";

        // Fetch all posts (including non-published for accurate tag counts)
        const posts = await prisma.posts.findMany({
            select: { id: true, tags: true, deleted: true },
        });

        // Create a map to store tag information
        const tagMap: Record<
            string,
            { count: number; posts: string[]; deletedPosts: string[] }
        > = {};

        posts.forEach((post) => {
            post.tags.forEach((tag) => {
                const normalizedTag = tag.trim().toLowerCase();
                if (!normalizedTag) return; // Skip empty tags

                if (!tagMap[normalizedTag]) {
                    tagMap[normalizedTag] = {
                        count: 0,
                        posts: [],
                        deletedPosts: [],
                    };
                }

                if (post.deleted) {
                    tagMap[normalizedTag].deletedPosts.push(post.id);
                } else {
                    tagMap[normalizedTag].count += 1;
                    tagMap[normalizedTag].posts.push(post.id);
                }
            });
        });

        // Get all existing tags from database
        const existingTags = await prisma.tags.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                aliases: true,
            },
        });

        const existingTagNames = new Set(existingTags.map((t) => t.name));
        const processedTagNames = new Set(Object.keys(tagMap));

        // Find orphaned tags (tags in DB but not in any posts)
        const orphanedTags = existingTags.filter(
            (t) => !processedTagNames.has(t.name),
        );

        // Update or create tags based on post data
        const tagUpserts = Object.entries(tagMap).map(
            async ([tagName, data]) => {
                const existingTag = existingTags.find(
                    (t) => t.name === tagName,
                );

                await prisma.tags.upsert({
                    where: { name: tagName },
                    update: {
                        count: data.count,
                        posts: data.posts,
                    },
                    create: {
                        name: tagName,
                        count: data.count,
                        posts: data.posts,
                        description: null,
                        color: null,
                        aliases: [],
                    },
                });
            },
        );

        await Promise.all(tagUpserts);

        // Handle orphaned tags
        let orphanedTagsDeleted = 0;
        let orphanedTagsUpdated = 0;

        if (cleanupOrphaned && orphanedTags.length > 0) {
            // Delete orphaned tags that have no aliases and no description
            // (i.e., tags that were auto-created and are now unused)
            const tagsToDelete = orphanedTags.filter(
                (t) =>
                    !t.description &&
                    !t.color &&
                    (!t.aliases || t.aliases.length === 0),
            );

            if (tagsToDelete.length > 0) {
                await prisma.tags.deleteMany({
                    where: {
                        id: { in: tagsToDelete.map((t) => t.id) },
                    },
                });
                orphanedTagsDeleted = tagsToDelete.length;
            }

            // Update remaining orphaned tags to have 0 count
            const tagsToUpdate = orphanedTags.filter(
                (t) =>
                    t.description ||
                    t.color ||
                    (t.aliases && t.aliases.length > 0),
            );

            if (tagsToUpdate.length > 0) {
                await prisma.tags.updateMany({
                    where: {
                        id: { in: tagsToUpdate.map((t) => t.id) },
                    },
                    data: {
                        count: 0,
                        posts: [],
                    },
                });
                orphanedTagsUpdated = tagsToUpdate.length;
            }
        } else if (orphanedTags.length > 0) {
            // Just update orphaned tags to have 0 count (don't delete)
            await prisma.tags.updateMany({
                where: {
                    id: { in: orphanedTags.map((t) => t.id) },
                },
                data: {
                    count: 0,
                    posts: [],
                },
            });
            orphanedTagsUpdated = orphanedTags.length;
        }

        // Get final counts
        const finalTagCount = await prisma.tags.count();
        const activeTagCount = await prisma.tags.count({
            where: { count: { gt: 0 } },
        });

        return NextResponse.json({
            success: true,
            message: "Tags recalculated successfully",
            stats: {
                totalTags: finalTagCount,
                activeTags: activeTagCount,
                orphanedTags: finalTagCount - activeTagCount,
                tagsProcessed: Object.keys(tagMap).length,
                tagsCreated: Object.keys(tagMap).filter(
                    (name) => !existingTagNames.has(name),
                ).length,
                orphanedTagsDeleted,
                orphanedTagsUpdated,
            },
        });
    } catch (error) {
        console.error("Error recalculating tags:", error);
        return NextResponse.json(
            { error: "Failed to recalculate tags" },
            { status: 500 },
        );
    }
}

// GET /api/v1/tags/process (get processing stats without actually processing)
export async function GET() {
    try {
        const [totalTags, activeTags, totalPosts] = await Promise.all([
            prisma.tags.count(),
            prisma.tags.count({ where: { count: { gt: 0 } } }),
            prisma.posts.count({ where: { deleted: false } }),
        ]);

        return NextResponse.json({
            stats: {
                totalTags,
                activeTags,
                orphanedTags: totalTags - activeTags,
                totalPosts,
            },
        });
    } catch (error) {
        console.error("Error fetching processing stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 },
        );
    }
}
