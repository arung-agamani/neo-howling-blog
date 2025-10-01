import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/utils/axios";

export interface Post {
    id: string;
    title: string;
    author?: string;
    datePosted: string;
    updatedAt?: string;
    description?: string;
    tags: string[];
    bannerUrl?: string;
    isPublished: boolean;
    deleted?: boolean;
}

export interface PostsResponse {
    success: boolean;
    errors: any[];
    data: Post[];
}

export interface CreatePostPayload {
    author: string;
    title: string;
    description: string;
    tags: string[];
    bannerUrl?: string;
    blogContent: string;
}

export interface UpdatePostPayload extends Partial<CreatePostPayload> {
    id: string;
    isPublished?: boolean;
}

// Query key factory for posts
export const postsKeys = {
    all: ["posts"] as const,
    lists: () => [...postsKeys.all, "list"] as const,
    list: (filters: Record<string, any>) => [...postsKeys.lists(), filters] as const,
    details: () => [...postsKeys.all, "detail"] as const,
    detail: (id: string) => [...postsKeys.details(), id] as const,
    related: (id: string) => [...postsKeys.all, "related", id] as const,
};

// Fetch posts function
const fetchPosts = async (): Promise<Post[]> => {
    const response = await axios.get<PostsResponse>("/api/v1/posts");
    return response.data.data || [];
};

// Fetch single post function
const fetchPost = async (id: string): Promise<Post> => {
    const response = await axios.get<Post>(`/api/v1/posts/${id}`);
    return response.data;
};

// Fetch related posts function
const fetchRelatedPosts = async (id: string): Promise<Post[]> => {
    const response = await axios.get<PostsResponse>(`/api/v1/posts?related=${id}`);
    return response.data.data || [];
};

// Create post function
const createPost = async (payload: CreatePostPayload): Promise<Post> => {
    const response = await axios.post<{ success: boolean; data: Post }>("/api/v1/posts", payload);
    return response.data.data;
};

// Update post function
const updatePost = async (payload: UpdatePostPayload): Promise<Post> => {
    const { id, ...updateData } = payload;
    const response = await axios.put<{ success: boolean; data: Post }>(`/api/v1/posts/${id}`, updateData);
    return response.data.data;
};

// Delete post function
const deletePost = async (id: string): Promise<void> => {
    await axios.delete(`/api/v1/posts/${id}`);
};

// React Query hook for fetching all posts
export const usePosts = () => {
    return useQuery({
        queryKey: postsKeys.lists(),
        queryFn: fetchPosts,
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
            queryClient.setQueryData(postsKeys.detail(updatedPost.id), updatedPost);

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
            queryClient.removeQueries({ queryKey: postsKeys.detail(deletedId) });

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

// Hook for prefetching posts (useful for navigation)
export const usePrefetchPosts = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.prefetchQuery({
            queryKey: postsKeys.lists(),
            queryFn: fetchPosts,
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
