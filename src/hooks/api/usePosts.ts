import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { get, post, patch, del } from "@/lib/ky/client";

export interface Post {
    id: string;
    title: string;
    link: string;
    author?: string;
    datePosted: string;
    updatedAt?: string;
    description?: string;
    tags: string[];
    bannerUrl?: string;
    isPublished: boolean;
    deleted?: boolean;
    blogContent?: string;
    blogContentDelta?: string | null;
}

export type PostStatusFilter = "all" | "published" | "draft" | "trash";

export interface PostsCounts {
    all: number;
    published: number;
    draft: number;
    trash: number;
}

export interface PostsPagination {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface PostsResponse {
    success: boolean;
    errors: unknown[];
    data: Post[];
    pagination: PostsPagination;
    counts: PostsCounts;
}

export interface PostListParams {
    page?: number;
    pageSize?: number;
    status?: PostStatusFilter;
    search?: string;
    /** Posts carrying any of these tags. */
    tags?: string[];
    /** Admin views include diary entries; public lists hide them. */
    includeDiary?: boolean;
}

export interface CreatePostPayload {
    author: string;
    title: string;
    description: string;
    tags: string[];
    bannerUrl?: string;
    blogContent: string;
    blogContentDelta?: string;
}

export interface UpdatePostPayload extends Partial<CreatePostPayload> {
    id: string;
    isPublished?: boolean;
}

// Query key factory for posts
export const postsKeys = {
    all: ["posts"] as const,
    lists: () => [...postsKeys.all, "list"] as const,
    list: (filters: Record<string, any>) =>
        [...postsKeys.lists(), filters] as const,
    details: () => [...postsKeys.all, "detail"] as const,
    detail: (id: string) => [...postsKeys.details(), id] as const,
    related: (id: string) => [...postsKeys.all, "related", id] as const,
};

// Fetch posts function
const fetchPosts = async (
    params: PostListParams = {},
): Promise<PostsResponse> => {
    const search = new URLSearchParams();
    if (params.page) search.set("page", String(params.page));
    if (params.pageSize) search.set("pageSize", String(params.pageSize));
    if (params.status) search.set("status", params.status);
    if (params.search) search.set("search", params.search);
    if (params.tags && params.tags.length > 0) {
        search.set("tags", params.tags.join(","));
    }
    if (params.includeDiary) search.set("includeDiary", "true");

    const query = search.toString();
    return await get<PostsResponse>(query ? `posts?${query}` : "posts");
};

// Fetch single post function
const fetchPost = async (id: string): Promise<Post> => {
    return await get<Post>(`posts/${id}`);
};

// Fetch related posts function
const fetchRelatedPosts = async (id: string): Promise<Post[]> => {
    const response = await get<PostsResponse>(`posts?related=${id}`);
    return response.data || [];
};

// Create post function
const createPost = async (payload: CreatePostPayload): Promise<Post> => {
    const response = await post<{ success: boolean; data: Post }>(
        "posts",
        payload,
    );
    return response.data;
};

// Update post function. The route expects the id and an op discriminator.
const updatePost = async (payload: UpdatePostPayload): Promise<Post> => {
    const { id, ...updateData } = payload;
    const response = await patch<{ success: boolean; data: Post }>(
        `posts/${id}`,
        { id, op: "update", ...updateData },
    );
    return response.data;
};

// Delete post function
const deletePost = async (id: string): Promise<void> => {
    await del(`posts/${id}`);
};

// React Query hook for the post list (server-side filters + pagination)
export const usePosts = (params: PostListParams = {}) => {
    return useQuery({
        queryKey: postsKeys.list(params as Record<string, unknown>),
        queryFn: () => fetchPosts(params),
        // Keep the current page visible while the next filter/page loads,
        // instead of dropping to the empty/skeleton state.
        placeholderData: keepPreviousData,
        staleTime: 3 * 60 * 1000, // 3 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: 3,
    });
};

// React Query hook for fetching a single post
export const usePost = (id: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: postsKeys.detail(id),
        queryFn: () => fetchPost(id),
        enabled: enabled && !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 3,
    });
};

// React Query hook for fetching related posts
export const useRelatedPosts = (id: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: postsKeys.related(id),
        queryFn: () => fetchRelatedPosts(id),
        enabled: enabled && !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
        retry: 2,
    });
};

// React Query mutation hook for creating posts
export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPost,
        onSuccess: (newPost) => {
            // Invalidate and refetch posts list
            queryClient.invalidateQueries({ queryKey: postsKeys.lists() });

            // Add the new post to the cache
            queryClient.setQueryData(postsKeys.detail(newPost.id), newPost);

            // Invalidate dashboard stats
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
        onError: (error) => {
            console.error("Failed to create post:", error);
        },
    });
};

// React Query mutation hook for updating posts
export const useUpdatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updatePost,
        onSuccess: (updatedPost) => {
            // Update the post in the detail cache
            queryClient.setQueryData(
                postsKeys.detail(updatedPost.id),
                updatedPost,
            );

            // Invalidate posts list to reflect changes
            queryClient.invalidateQueries({ queryKey: postsKeys.lists() });

            // Invalidate dashboard stats
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
        onError: (error) => {
            console.error("Failed to update post:", error);
        },
    });
};

// React Query mutation hook for deleting posts
export const useDeletePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePost,
        onSuccess: (_, deletedId) => {
            // Remove the post from all relevant caches
            queryClient.removeQueries({
                queryKey: postsKeys.detail(deletedId),
            });

            // Invalidate posts list
            queryClient.invalidateQueries({ queryKey: postsKeys.lists() });

            // Invalidate dashboard stats
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
        onError: (error) => {
            console.error("Failed to delete post:", error);
        },
    });
};

// Publish or unpublish a post
export const useSetPostPublished = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            isPublished,
        }: {
            id: string;
            isPublished: boolean;
        }) => {
            const response = await patch<{ success: boolean; data: Post }>(
                `posts/${id}`,
                { id, op: "publish", isPublished },
            );
            return response.data;
        },
        onSuccess: (post) => {
            queryClient.setQueryData(postsKeys.detail(post.id), post);
            queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
    });
};

// Move a post to the trash, or restore it
export const useSetPostDeleted = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            deleted,
        }: {
            id: string;
            deleted: boolean;
        }) => {
            const response = await patch<{ success: boolean; data: Post }>(
                `posts/${id}`,
                { id, op: "update", deleted },
            );
            return response.data;
        },
        onSuccess: (post) => {
            queryClient.setQueryData(postsKeys.detail(post.id), post);
            queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
    });
};

// Permanently remove a trashed post
export const usePurgePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await del(`posts/${id}?hard=true`);
        },
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: postsKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
    });
};

// Hook for prefetching posts (useful for navigation)
export const usePrefetchPosts = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.prefetchQuery({
            queryKey: postsKeys.list({}),
            queryFn: () => fetchPosts(),
            staleTime: 3 * 60 * 1000,
        });
    };
};

// Hook for prefetching a single post
export const usePrefetchPost = () => {
    const queryClient = useQueryClient();

    return (id: string) => {
        queryClient.prefetchQuery({
            queryKey: postsKeys.detail(id),
            queryFn: () => fetchPost(id),
            staleTime: 5 * 60 * 1000,
        });
    };
};

// Hook for invalidating posts cache (useful after external changes)
export const useInvalidatePosts = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({
            queryKey: postsKeys.all,
        });
    };
};

// Hook for optimistic updates
export const useOptimisticPostUpdate = () => {
    const queryClient = useQueryClient();

    return (id: string, updater: (old: Post) => Post) => {
        queryClient.setQueryData(postsKeys.detail(id), updater);
    };
};
