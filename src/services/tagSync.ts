import prisma from "@/utils/prisma";
import { Prisma } from "@prisma/client";

/**
 * Tag names are canonical lowercase. The editor already lowercases, but API
 * clients may not, and the tag collection is keyed by name.
 */
export function normalizeTags(tags: string[] | null | undefined): string[] {
    if (!tags) return [];

    const seen = new Set<string>();
    const result: string[] = [];

    for (const raw of tags) {
        const name = raw.trim().toLowerCase();
        if (!name || seen.has(name)) continue;
        seen.add(name);
        result.push(name);
    }

    return result;
}

export interface TagDiff {
    added: string[];
    removed: string[];
}

/** Tags present in `after` but not `before`, and vice versa. */
export function diffTagSets(before: string[], after: string[]): TagDiff {
    const beforeSet = new Set(before);
    const afterSet = new Set(after);

    return {
        added: after.filter((tag) => !beforeSet.has(tag)),
        removed: before.filter((tag) => !afterSet.has(tag)),
    };
}

/**
 * Add or remove a post from a tag's membership. `count` is derived from the
 * membership list rather than incremented, so repeated saves also repair
 * drift left by earlier writes.
 */
async function setTagMembership(
    name: string,
    postId: string,
    present: boolean,
): Promise<void> {
    const tag = await prisma.tags.findUnique({
        where: { name },
        select: { posts: true },
    });

    if (!tag) {
        if (!present) return;
        try {
            await prisma.tags.create({
                data: { name, count: 1, posts: [postId], aliases: [] },
            });
            return;
        } catch (error) {
            // Two saves can race to create the same new tag.
            const conflict =
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002";
            if (!conflict) throw error;
        }

        const created = await prisma.tags.findUnique({
            where: { name },
            select: { posts: true },
        });
        if (!created || created.posts.includes(postId)) return;
        const posts = [...created.posts, postId];
        await prisma.tags.update({
            where: { name },
            data: { posts, count: posts.length },
        });
        return;
    }

    const hasPost = tag.posts.includes(postId);
    if (hasPost === present) return;

    const posts = present
        ? [...tag.posts, postId]
        : tag.posts.filter((id) => id !== postId);

    await prisma.tags.update({
        where: { name },
        data: { posts, count: posts.length },
    });
}

/**
 * Reconcile a post's counted tags.
 *
 * `before` and `after` must already exclude tags of trashed posts, so
 * trashing removes a post from every count and restoring adds it back.
 * Failures are logged, never thrown: the post itself is already saved and
 * `POST /api/v1/tags/process` can rebuild counts from scratch.
 */
export async function applyTagDiff(
    postId: string,
    before: string[],
    after: string[],
): Promise<void> {
    const { added, removed } = diffTagSets(before, after);
    if (added.length === 0 && removed.length === 0) return;

    try {
        await Promise.all([
            ...removed.map((tag) => setTagMembership(tag, postId, false)),
            ...added.map((tag) => setTagMembership(tag, postId, true)),
        ]);
    } catch (error) {
        console.error("[tagSync] Failed to update tag membership", {
            postId,
            added,
            removed,
            error,
        });
    }
}
