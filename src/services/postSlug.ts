import prisma from "@/utils/prisma";
import { slugFromTitle } from "@/utils/slug";

/**
 * Canonicalise a slug. Empty results (e.g. a title made only of punctuation)
 * fall back to "post" so a post always has a resolvable URL.
 */
export function normalizePostLink(input: string): string {
    return slugFromTitle(input) || "post";
}

/**
 * Resolve a slug that no other post already claims, appending `-2`, `-3`, …
 * on collision. Uniqueness is enforced here rather than by a database index so
 * existing duplicates do not need a migration first.
 */
export async function ensureUniqueLink(
    base: string,
    excludeId?: string,
): Promise<string> {
    const root = normalizePostLink(base);

    for (let attempt = 1; attempt <= 200; attempt++) {
        const candidate = attempt === 1 ? root : `${root}-${attempt}`;
        const existing = await prisma.posts.findFirst({
            where: {
                link: candidate,
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
            select: { id: true },
        });
        if (!existing) return candidate;
    }

    // Pathological collision run: keep it unique without looping forever.
    return `${root}-${Date.now().toString(36)}`;
}
