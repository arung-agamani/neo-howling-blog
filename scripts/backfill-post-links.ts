/**
 * Backfill script to populate the `link` field for all posts
 * based on their title using the slugFromTitle utility.
 *
 * Usage: bun scripts/backfill-post-links.ts
 *
 * This script will:
 * 1. Fetch all posts from the database (only id, title, link fields)
 * 2. Generate a slug from each post's title
 * 3. Update the post's `link` field with the generated slug using raw query
 * 4. Handle duplicates by appending a suffix
 */

import { PrismaClient } from "@prisma/client";
import { slugFromTitle } from "../src/utils/slug";

const prisma = new PrismaClient();

async function backfillPostLinks() {
    console.log("Starting backfill of post links...\n");

    try {
        // Fetch only the fields we need to avoid issues with corrupted data
        const posts = await prisma.posts.findMany({
            select: {
                id: true,
                title: true,
                link: true,
            },
        });

        console.log(`Found ${posts.length} posts to process.\n`);

        // Track used links to handle duplicates
        const usedLinks = new Set<string>();
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const post of posts) {
            // Generate slug from title
            let baseSlug = slugFromTitle(post.title);
            let finalSlug = baseSlug;
            let suffix = 1;

            // Handle duplicates by appending a suffix
            while (usedLinks.has(finalSlug)) {
                finalSlug = `${baseSlug}-${suffix}`;
                suffix++;
            }

            usedLinks.add(finalSlug);

            // Check if update is needed
            if (post.link === finalSlug) {
                console.log(
                    `[SKIP] Post "${post.title}" already has link: ${finalSlug}`,
                );
                skippedCount++;
                continue;
            }

            try {
                // Use updateMany with specific where clause to avoid fetching the entire document
                // This bypasses reading other potentially corrupted fields
                await prisma.posts.updateMany({
                    where: { id: post.id },
                    data: { link: finalSlug },
                });

                console.log(`[UPDATE] Post "${post.title}"`);
                console.log(`         Old link: ${post.link || "(empty)"}`);
                console.log(`         New link: ${finalSlug}\n`);
                updatedCount++;
            } catch (updateError) {
                console.error(
                    `[ERROR] Failed to update post "${post.title}" (${post.id}):`,
                    updateError,
                );
                errorCount++;
            }
        }

        console.log("\n=== Backfill Complete ===");
        console.log(`Total posts: ${posts.length}`);
        console.log(`Updated: ${updatedCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);
    } catch (error) {
        console.error("Error during backfill:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
backfillPostLinks();
