import React from "react";
import Link from "next/link";
import prisma from "@/utils/prisma";
import { slugFromTitle } from "@/utils/slug";
import {
    Heading,
    Lead,
    Muted,
} from "@/components/Typography";
import PostContentRenderer from "@/components/PostContentRenderer";
import RecommendedPosts from "@/components/UserPageV2/RecommendedPost";
import { Metadata } from "next";
import PageReadySignal from "@/components/UserPageV2/PageReadySignal";

async function findPostByIdentifier(identifier: string) {
    // Decode URL-encoded identifier (e.g., %E6%97%A5%E8%A8%98 -> 日記)
    const decodedIdentifier = decodeURIComponent(identifier);

    // Check if identifier looks like a MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(decodedIdentifier);

    // 1. Try to find by ID first (only if it looks like an ObjectId)
    if (isObjectId) {
        const postById = await prisma.posts.findFirst({
            where: { id: decodedIdentifier },
        });
        if (postById) return postById;
    }

    // 2. Try to find by link field (try both decoded and original)
    const postByLink = await prisma.posts.findFirst({
        where: { link: decodedIdentifier },
    });
    if (postByLink) return postByLink;

    // 3. Try to find by title slug (infer from title)
    const allPosts = await prisma.posts.findMany({
        where: {
            isPublished: true,
            deleted: { not: true },
        },
        select: {
            id: true,
            title: true,
            author: true,
            bannerUrl: true,
            blogContent: true,
            blogContentDelta: true,
            datePosted: true,
            description: true,
            imageheader: true,
            isBannerDark: true,
            isFeatured: true,
            isPublished: true,
            link: true,
            tags: true,
            updatedAt: true,
            deleted: true,
            deletedAt: true,
            v: true,
        },
    });

    const postBySlug = allPosts.find(
        (post) => slugFromTitle(post.title) === decodedIdentifier,
    );

    return postBySlug || null;
}

export async function generateMetadata(props: {
    params: Promise<{ identifier: string }>;
}): Promise<Metadata> {
    const params = await props.params;
    const { identifier } = params;
    const postData = await findPostByIdentifier(identifier);

    const metadata: Metadata = {
        title: postData?.title || "Post not found",
        description:
            postData?.description || "The requested post could not be found.",
        metadataBase: new URL("https://blog.howlingmoon.dev"),
        openGraph: {
            title: postData?.title || "Post not found",
            description:
                postData?.description ||
                "The requested post could not be found.",
            url: `https://blog.howlingmoon.dev/post/${identifier}`,
            images: [
                {
                    url:
                        postData?.bannerUrl ||
                        "https://cdn.howlingmoon.dev/123623765.jpg",
                },
            ],
            type: "article",
        },
    };

    return metadata;
}

export default async function PostDetailPage({
    params,
}: {
    params: Promise<{ identifier: string }>;
}) {
    const { identifier } = await params;
    const postData = await findPostByIdentifier(identifier);

    return (
        <PageReadySignal>
            <div className="p-6 bg-white/85 contrast:bg-white dark:bg-slate-800/55 dark:contrast:bg-slate-800 shadow">
                <nav aria-label="breadcrumb">
                    <ol className="flex space-x-2 text-sm">
                        <li>
                            <Link
                                href="/"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Home
                            </Link>
                        </li>
                        <li>
                            <span className="text-gray-400 dark:text-gray-500">
                                /
                            </span>
                        </li>
                        <li
                            aria-current="page"
                            className="text-gray-700 dark:text-gray-200 font-semibold"
                        >
                            {decodeURIComponent(identifier)}
                        </li>
                    </ol>
                </nav>
                <Heading className="mt-4 mb-2">{postData?.title}</Heading>
                <Lead>{postData?.description}</Lead>
                <Muted>
                    Published at:{" "}
                    {new Date(postData?.datePosted || "").toLocaleString(
                        "en",
                    )}{" "}
                </Muted>
                <div className="dark:border-b-slate-700 border-b-slate-300 border-b" />
                <PostContentRenderer html={postData?.blogContent ?? ""} />
                <hr />
                <RecommendedPosts postId={identifier} />
            </div>
        </PageReadySignal>
    );
}
