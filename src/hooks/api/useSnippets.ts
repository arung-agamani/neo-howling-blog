import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch, del } from "@/lib/ky/client";

export interface Snippet {
    id: string;
    title: string;
    description?: string;
    content: string;
    type: string;
    slug: string;
    datePosted: string;
    updatedAt?: string;
    ownerId: string;
}

export interface SnippetsResponse {
    success: boolean;
    errors?: any[];
    data?: Snippet[];
}

export interface SnippetResponse {
    success: boolean;
    message?: string;
    data?: Snippet;
}

export interface CreateSnippetPayload {
    content: string; // Content with frontmatter
}

export interface UpdateSnippetPayload {
    content: string; // Content with frontmatter
}

// Query key factory for snippets
export const snippetsKeys = {
    all: ["snippets"] as const,
    lists: () => [...snippetsKeys.all, "list"] as const,
    list: (filters: Record<string, any>) =>
        [...snippetsKeys.lists(), filters] as const,
    details: () => [...snippetsKeys.all, "detail"] as const,
    detail: (id: string) => [...snippetsKeys.details(), id] as const,
};

// Fetch snippets function
const fetchSnippets = async (): Promise<Snippet[]> => {
    const response = await get<SnippetsResponse>("snippets");
    return response.data || [];
};

// Fetch single snippet function
const fetchSnippet = async (id: string): Promise<Snippet> => {
    return await get<Snippet>(`snippets/${id}`);
};

// Create snippet function
const createSnippet = async (
    payload: CreateSnippetPayload,
): Promise<Snippet> => {
    const response = await post<SnippetResponse>("snippets", payload);
    return response.data!;
};

// Update snippet function
const updateSnippet = async (
    id: string,
    payload: UpdateSnippetPayload,
): Promise<Snippet> => {
    const response = await patch<SnippetResponse>(`snippets/${id}`, payload);
    return response.data!;
};

// Delete snippet function
const deleteSnippet = async (id: string): Promise<void> => {
    await del(`snippets/${id}`);
};

// React Query hook for fetching all snippets
export const useSnippets = () => {
    return useQuery({
        queryKey: snippetsKeys.lists(),
        queryFn: fetchSnippets,
        staleTime: 3 * 60 * 1000, // 3 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: 3,
    });
};

// React Query hook for fetching a single snippet
export const useSnippet = (id: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: snippetsKeys.detail(id),
        queryFn: () => fetchSnippet(id),
        enabled: enabled && !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 3,
    });
};

// React Query mutation hook for creating snippets
export const useCreateSnippet = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSnippet,
        onSuccess: (newSnippet) => {
            // Invalidate and refetch snippets list
            queryClient.invalidateQueries({ queryKey: snippetsKeys.lists() });

            // Add the new snippet to the cache
            queryClient.setQueryData(
                snippetsKeys.detail(newSnippet.id),
                newSnippet,
            );

            // Invalidate dashboard stats if they exist
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
        onError: (error) => {
            console.error("Failed to create snippet:", error);
        },
    });
};

// React Query mutation hook for updating snippets
export const useUpdateSnippet = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateSnippetPayload }) =>
            updateSnippet(id, payload),
        onSuccess: (updatedSnippet) => {
            // Update the snippet in the detail cache
            queryClient.setQueryData(
                snippetsKeys.detail(updatedSnippet.id),
                updatedSnippet,
            );

            // Invalidate snippets list to reflect changes
            queryClient.invalidateQueries({ queryKey: snippetsKeys.lists() });

            // Invalidate dashboard stats if they exist
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
        onError: (error) => {
            console.error("Failed to update snippet:", error);
        },
    });
};

// React Query mutation hook for deleting snippets
export const useDeleteSnippet = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteSnippet,
        onSuccess: (_, deletedId) => {
            // Remove the snippet from all relevant caches
            queryClient.removeQueries({
                queryKey: snippetsKeys.detail(deletedId),
            });

            // Invalidate snippets list
            queryClient.invalidateQueries({ queryKey: snippetsKeys.lists() });

            // Invalidate dashboard stats if they exist
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
        onError: (error) => {
            console.error("Failed to delete snippet:", error);
        },
    });
};

// Hook for prefetching snippets (useful for navigation)
export const usePrefetchSnippets = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.prefetchQuery({
            queryKey: snippetsKeys.lists(),
            queryFn: fetchSnippets,
            staleTime: 3 * 60 * 1000,
        });
    };
};

// Hook for prefetching a single snippet
export const usePrefetchSnippet = () => {
    const queryClient = useQueryClient();

    return (id: string) => {
        queryClient.prefetchQuery({
            queryKey: snippetsKeys.detail(id),
            queryFn: () => fetchSnippet(id),
            staleTime: 5 * 60 * 1000,
        });
    };
};

// Hook for invalidating snippets cache (useful after external changes)
export const useInvalidateSnippets = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({
            queryKey: snippetsKeys.all,
        });
    };
};
