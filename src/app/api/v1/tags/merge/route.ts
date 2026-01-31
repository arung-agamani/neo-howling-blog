import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { z } from "zod";

// Validation schema for merging tags
const MergeTagsSchema = z.object({
    sourceTags: z
        .array(z.string().min(1))
        .min(1, "At least one source tag is required"),
    targetTag: z.string().min(1, "Target tag name is required"),
    keepAsAliases: z.boolean().optional().default(true),
    deleteSourceTags: z.boolean().optional().default(true),
});

// POST /api/v1/tags/merge (merge multiple tags into one)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate request body
        const parseResult = MergeTagsSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: parseResult.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const { sourceTags, targetTag, keepAsAliases, deleteSourceTags } =
            parseResult.data;

        // Normalize all tag names
        const normalizedSourceTags = sourceTags.map((t) =>
            t.trim().toLowerCase(),
        );
        const normalizedTargetTag = targetTag.trim().toLowerCase();

        // Filter out target tag from source tags if present
        const tagsToMerge = normalizedSourceTags.filter(
            (t) => t !== normalizedTargetTag,
        );

        if (tagsToMerge.length === 0) {
            return NextResponse.json(
                { error: "No tags to merge after filtering" },
                { status: 400 },
            );
        }

        // Check if target tag exists, if not we'll create it
        let targetTagRecord = await prisma.tags.findFirst({
            where: { name: normalizedTargetTag },
        });

        // Get all source tag records
        const sourceTagRecords = await prisma.tags.findMany({
            where: { name: { in: tagsToMerge } },
        });

        const foundSourceTagNames = sourceTagRecords.map((t) => t.name);
        const missingTags = tagsToMerge.filter(
            (t) => !foundSourceTagNames.includes(t),
        );

        if (missingTags.length > 0 && sourceTagRecords.length === 0) {
            return NextResponse.json(
                {
                    error: "None of the source tags were found",
                    missingTags,
                },
                { status: 404 },
            );
        }

        // Find all posts that have any of the source tags
        const allTagsToSearch = [...tagsToMerge];
        if (!targetTagRecord) {
            // If target doesn't exist yet, only search for source tags
        }

        const postsWithSourceTags = await prisma.posts.findMany({
            where: {
                tags: { hasSome: allTagsToSearch },
            },
            select: { id: true, tags: true },
        });

        // Collect all unique post IDs that will have the target tag
        const allPostIds = new Set<string>();
        if (targetTagRecord) {
            targetTagRecord.posts.forEach((id) => allPostIds.add(id));
        }

        // Update each post: replace source tags with target tag
        const postUpdates = postsWithSourceTags.map((post) => {
            // Add this post to the collection
            allPostIds.add(post.id);

            // Remove all source tags and ensure target tag is present
            const updatedTags = post.tags
                .filter(
                    (t) =>
                        !tagsToMerge.includes(t.toLowerCase()) &&
                        t.toLowerCase() !== normalizedTargetTag,
                )
                .concat(normalizedTargetTag);

            return prisma.posts.update({
                where: { id: post.id },
                data: { tags: updatedTags },
            });
        });

        // Collect aliases from source tags if keeping as aliases
        const newAliases: string[] = [];
        if (keepAsAliases) {
            sourceTagRecords.forEach((tag) => {
                newAliases.push(tag.name);
                if (tag.aliases) {
                    newAliases.push(...tag.aliases);
                }
            });
        }

        // Also add existing aliases from target tag if it exists
        const existingAliases = targetTagRecord?.aliases || [];

        // Deduplicate aliases and remove target tag name from aliases
        const finalAliases = [
            ...new Set([...existingAliases, ...newAliases]),
        ].filter((a) => a !== normalizedTargetTag);

        // Create or update the target tag
        const targetTagData = {
            name: normalizedTargetTag,
            count: allPostIds.size,
            posts: Array.from(allPostIds),
            aliases: finalAliases,
            description: targetTagRecord?.description || null,
            color: targetTagRecord?.color || null,
        };

        // Build the transaction
        const transactionOperations: any[] = [...postUpdates];

        if (targetTagRecord) {
            transactionOperations.push(
                prisma.tags.update({
                    where: { id: targetTagRecord.id },
                    data: {
                        count: targetTagData.count,
                        posts: targetTagData.posts,
                        aliases: targetTagData.aliases,
                    },
                }),
            );
        } else {
            transactionOperations.push(
                prisma.tags.create({
                    data: targetTagData,
                }),
            );
        }

        // Delete source tags if requested
        if (deleteSourceTags && sourceTagRecords.length > 0) {
            transactionOperations.push(
                prisma.tags.deleteMany({
                    where: {
                        id: { in: sourceTagRecords.map((t) => t.id) },
                    },
                }),
            );
        }

        // Execute all operations in a transaction
        await prisma.$transaction(transactionOperations);

        // Fetch the updated target tag
        const updatedTargetTag = await prisma.tags.findFirst({
            where: { name: normalizedTargetTag },
        });

        return NextResponse.json({
            success: true,
            message: `Successfully merged ${tagsToMerge.length} tag(s) into "${normalizedTargetTag}"`,
            targetTag: updatedTargetTag,
            mergedTags: foundSourceTagNames,
            postsUpdated: postsWithSourceTags.length,
            aliasesAdded: keepAsAliases ? newAliases : [],
        });
    } catch (error) {
        console.error("Error merging tags:", error);
        return NextResponse.json(
            { error: "Failed to merge tags" },
            { status: 500 },
        );
    }
}

// GET /api/v1/tags/merge (preview merge operation)
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const sourceTagsParam = searchParams.get("sourceTags");
        const targetTag = searchParams.get("targetTag");

        if (!sourceTagsParam || !targetTag) {
            return NextResponse.json(
                { error: "sourceTags and targetTag are required" },
                { status: 400 },
            );
        }

        const sourceTags = sourceTagsParam.split(",").map((t) => t.trim().toLowerCase());
        const normalizedTargetTag = targetTag.trim().toLowerCase();

        // Filter out target from sources
        const tagsToMerge = sourceTags.filter((t) => t !== normalizedTargetTag);

        if (tagsToMerge.length === 0) {
            return NextResponse.json(
                { error: "No tags to merge after filtering" },
                { status: 400 },
            );
        }

        // Get source tag records
        const sourceTagRecords = await prisma.tags.findMany({
            where: { name: { in: tagsToMerge } },
        });

        // Get target tag if exists
        const targetTagRecord = await prisma.tags.findFirst({
            where: { name: normalizedTargetTag },
        });

        // Find affected posts
        const affectedPosts = await prisma.posts.findMany({
            where: {
                tags: { hasSome: tagsToMerge },
            },
            select: { id: true, title: true, tags: true },
        });

        // Calculate resulting tag count
        const allPostIds = new Set<string>();
        if (targetTagRecord) {
            targetTagRecord.posts.forEach((id) => allPostIds.add(id));
        }
        affectedPosts.forEach((post) => allPostIds.add(post.id));

        return NextResponse.json({
            preview: true,
            sourceTags: sourceTagRecords.map((t) => ({
                name: t.name,
                count: t.count,
                aliases: t.aliases || [],
            })),
            targetTag: targetTagRecord
                ? {
                      name: targetTagRecord.name,
                      count: targetTagRecord.count,
                      aliases: targetTagRecord.aliases || [],
                  }
                : {
                      name: normalizedTargetTag,
                      count: 0,
                      willBeCreated: true,
                  },
            affectedPosts: affectedPosts.map((p) => ({
                id: p.id,
                title: p.title,
            })),
            summary: {
                tagsToMerge: tagsToMerge.length,
                postsToUpdate: affectedPosts.length,
                resultingPostCount: allPostIds.size,
            },
        });
    } catch (error) {
        console.error("Error previewing merge:", error);
        return NextResponse.json(
            { error: "Failed to preview merge" },
            { status: 500 },
        );
    }
}
