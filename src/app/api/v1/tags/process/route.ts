import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// POST /api/v1/tags/process (recalculate tags)
export async function POST() {
    try {
        // Fetch all posts
        const posts = await prisma.posts.findMany({
            select: { id: true, tags: true },
        });
        // Create a map to store tag information
        const tagMap: Record<string, { count: number; posts: string[] }> = {};
        posts.forEach((post) => {
            post.tags.forEach((tag) => {
                const normalizedTag = tag.trim().toLowerCase();
                if (!tagMap[normalizedTag]) {
                    tagMap[normalizedTag] = { count: 0, posts: [] };
                }
                tagMap[normalizedTag].count += 1;
                tagMap[normalizedTag].posts.push(post.id);
            });
        });
        // Update the tags collection in the database
        const tagUpdates = Object.entries(tagMap).map(
            async ([tagName, data]) => {
                await prisma.tags.upsert({
                    where: { name: tagName },
                    update: { count: data.count, posts: data.posts },
                    create: {
                        name: tagName,
                        count: data.count,
                        posts: data.posts,
                    },
                });
            }
        );
        await Promise.all(tagUpdates);
        return NextResponse.json({ message: "Tags recalculated successfully" });
    } catch (error) {
        console.error("Error recalculating tags:", error);
        return NextResponse.json(
            { error: "Failed to recalculate tags" },
            { status: 500 }
        );
    }
}
