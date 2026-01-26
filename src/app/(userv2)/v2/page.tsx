"use client";

import { Lead } from "@/components/Typography";
import React, { useEffect, useCallback, useRef } from "react";
import { ApiV1PaginatedResponse, Post } from "./APIContract";
import PostList from "@/components/UserPageV2/PostList";
import { useAtom } from "jotai";
import { PostsStateAtom } from "@/components/UserPageV2/JotaiAtoms/PostAtom";
import PageReadySignal from "@/components/UserPageV2/PageReadySignal";
import { usePreferences } from "./ThemeProvider";

const Page = () => {
    const [postsState, setPostsState] = useAtom(PostsStateAtom);
    const { showDiary } = usePreferences();
    const observerTarget = useRef<HTMLDivElement>(null);
    const previousShowDiary = useRef<boolean | null>(null);

    const fetchPosts = useCallback(
        async (page: number, reset: boolean = false) => {
            if (reset) {
                setPostsState((prev) => ({
                    ...prev,
                    isLoading: true,
                    error: false,
                }));
            } else {
                setPostsState((prev) => ({
                    ...prev,
                    isLoadingMore: true,
                }));
            }

            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    pageSize: "10",
                    includeDiary: showDiary.toString(),
                });

                const res = await fetch(`/api/v1/posts?${params.toString()}`);
                const data = (await res.json()) as ApiV1PaginatedResponse<
                    Post[]
                >;

                if (data.success) {
                    setPostsState((prev) => ({
                        posts: reset
                            ? data.data
                            : [...prev.posts, ...data.data],
                        pagination: data.pagination,
                        isLoading: false,
                        isLoadingMore: false,
                        error: false,
                    }));
                } else {
                    setPostsState((prev) => ({
                        ...prev,
                        isLoading: false,
                        isLoadingMore: false,
                        error: true,
                    }));
                }
            } catch {
                setPostsState((prev) => ({
                    ...prev,
                    isLoading: false,
                    isLoadingMore: false,
                    error: true,
                }));
            }
        },
        [showDiary, setPostsState],
    );

    // Initial fetch and refetch when showDiary changes
    useEffect(() => {
        const shouldRefetch =
            previousShowDiary.current !== null &&
            previousShowDiary.current !== showDiary;
        const isInitialLoad =
            postsState.posts.length === 0 &&
            !postsState.error &&
            !postsState.isLoading;

        if (shouldRefetch || isInitialLoad) {
            fetchPosts(1, true);
        }

        previousShowDiary.current = showDiary;
    }, [
        showDiary,
        fetchPosts,
        postsState.posts.length,
        postsState.error,
        postsState.isLoading,
    ]);

    // Intersection Observer for lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    postsState.pagination?.hasNextPage &&
                    !postsState.isLoadingMore &&
                    !postsState.isLoading
                ) {
                    fetchPosts(postsState.pagination.page + 1, false);
                }
            },
            { threshold: 0.1 },
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [
        postsState.pagination,
        postsState.isLoadingMore,
        postsState.isLoading,
        fetchPosts,
    ]);

    const { posts, isLoading, isLoadingMore, error, pagination } = postsState;

    // Filter to only show published posts
    const publishedPosts = posts.filter((x) => x.isPublished);

    return (
        <PageReadySignal>
            {isLoading && (
                <div>
                    <Lead className="text-white text-center mb-4">
                        Loading...
                    </Lead>
                    <img
                        src="https://cdn.howlingmoon.dev/sirkel.id/kururin-kuru-kuru.gif"
                        height={200}
                        alt="Loading..."
                        className="mx-auto"
                    />
                </div>
            )}
            {error && !isLoading && (
                <div>
                    <Lead className="text-white text-center mb-4">
                        Error when fetching.
                    </Lead>
                    <img
                        src="https://cdn.howlingmoon.dev/sirkel.id/89325870.gif"
                        height={200}
                        alt="Error"
                        className="mx-auto"
                    />
                </div>
            )}
            {!isLoading && !error && (
                <>
                    <PostList posts={publishedPosts} />
                    {isLoadingMore && (
                        <div className="flex justify-center py-4">
                            <Lead className="text-white text-center">
                                Loading more...
                            </Lead>
                        </div>
                    )}
                    {pagination &&
                        !pagination.hasNextPage &&
                        posts.length > 0 && (
                            <div className="flex justify-center py-4">
                                <Lead className="text-white/60 text-center text-sm">
                                    You&apos;ve reached the end
                                </Lead>
                            </div>
                        )}
                    {/* Intersection observer target */}
                    <div ref={observerTarget} className="h-4" />
                </>
            )}
        </PageReadySignal>
    );
};

export default Page;
