"use client";
import { ApiV1Response, RecommendedPost } from "@/app/(userv2)/v2/APIContract";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { Heading, Lead, Text } from "../Typography";

interface Props {
    postId: string;
}

const RecommendedPosts: React.FC<Props> = ({ postId }) => {
    const { ref, inView } = useInView({
        threshold: 0,
        triggerOnce: true,
    });
    const [recommendedPosts, setRecommendedPosts] =
        useState<ApiV1Response<RecommendedPost[]>>();
    const fetchRecommendedPosts = useCallback(async () => {
        const res = await fetch(`/api/v1/posts?related=${postId}`);
        const data = (await res.json()) as ApiV1Response<RecommendedPost[]>;
        setRecommendedPosts(data);
    }, [postId]);

    useEffect(() => {
        if (inView && !recommendedPosts) {
            fetchRecommendedPosts();
        }
    }, [inView, fetchRecommendedPosts, recommendedPosts]);

    return (
        <div
            ref={ref}
            className="mt-8 border-t-slate-700/50 dark:border-b-slate-300/50 border-t pt-4"
        >
            {recommendedPosts &&
                recommendedPosts.success &&
                recommendedPosts.data.length > 0 && (
                    <>
                        <Heading level={4} className="font-bold mb-4">
                            Recommended Posts
                        </Heading>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recommendedPosts.data.slice(0, 3).map((post) => (
                                <Link
                                    href={`/v2/post/${post.link || post.id}`}
                                    key={post.id}
                                    className="bg-slate-100 dark:bg-gray-800 border-0 border-slate-300 dark:border-slate-900 dark:shadow-sm dark:shadow-slate-600 rounded-lg overflow-hidden shadow-sm shadow-slate-400 hover:shadow-md hover:shadow-slate-400 transition-shadow duration-300"
                                >
                                    <div className="p-4">
                                        <Text
                                            weight="bold"
                                            size="xl"
                                            className="mb-2"
                                        >
                                            {post.title}
                                        </Text>
                                        <Lead className="mb-2">
                                            {post.description}
                                        </Lead>
                                        <Text className="" size="xs">
                                            {new Date(
                                                post.datePosted,
                                            ).toLocaleDateString()}
                                        </Text>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            {recommendedPosts &&
                recommendedPosts.success &&
                recommendedPosts.data.length === 0 && (
                    <p className="text-white">
                        No recommended posts available.
                    </p>
                )}
            {recommendedPosts && !recommendedPosts.success && (
                <p className="text-red-500">
                    Failed to load recommended posts.
                </p>
            )}
            {!recommendedPosts && (
                <p className="text-white">Loading recommended posts...</p>
            )}
        </div>
    );
};

export default RecommendedPosts;
