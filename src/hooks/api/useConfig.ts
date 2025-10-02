import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del } from "@/lib/ky/client";

export interface Config {
    id: string;
    key: string;
    value: string;
    description: string;
}

export interface ConfigResponse {
    count: number;
    data: Config[];
}

export interface CreateConfigRequest {
    key: string;
    value: string;
    description?: string;
}

export interface UpdateConfigRequest {
    id?: string;
    key: string;
    value: string;
    description?: string;
}

export interface ConfigUpdateResponse {
    message: string;
    data: Config;
}

export interface ConfigDeleteResponse {
    message: string;
    data: Config;
}

// Query keys
export const configKeys = {
    all: ["configs"] as const,
    lists: () => [...configKeys.all, "list"] as const,
    list: (filters: string) => [...configKeys.lists(), { filters }] as const,
    details: () => [...configKeys.all, "detail"] as const,
    detail: (id: string) => [...configKeys.details(), id] as const,
};

// Hook to fetch all configs
export const useConfigs = () => {
    return useQuery({
        queryKey: configKeys.lists(),
        queryFn: async (): Promise<ConfigResponse> => {
            return get<ConfigResponse>("config");
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};

// Hook to create a new config
export const useCreateConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateConfigRequest): Promise<Config> => {
            return post<Config>("config", data);
        },
        onSuccess: () => {
            // Invalidate and refetch configs list
            queryClient.invalidateQueries({ queryKey: configKeys.lists() });
        },
        onError: (error) => {
            console.error("Failed to create config:", error);
        },
    });
};

// Hook to update a config (using PUT endpoint which upserts by key)
export const useUpdateConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateConfigRequest): Promise<ConfigUpdateResponse> => {
            return put<ConfigUpdateResponse>("config", data);
        },
        onSuccess: () => {
            // Invalidate and refetch configs list
            queryClient.invalidateQueries({ queryKey: configKeys.lists() });
        },
        onError: (error) => {
            console.error("Failed to update config:", error);
        },
    });
};

// Hook to delete a config
export const useDeleteConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<ConfigDeleteResponse> => {
            return del<ConfigDeleteResponse>(`config?id=${id}`);
        },
        onSuccess: () => {
            // Invalidate and refetch configs list
            queryClient.invalidateQueries({ queryKey: configKeys.lists() });
        },
        onError: (error) => {
            console.error("Failed to delete config:", error);
        },
    });
};

// Hook to upsert a config (using POST endpoint which upserts by id)
export const useUpsertConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateConfigRequest): Promise<Config> => {
            return post<Config>("config", data);
        },
        onSuccess: () => {
            // Invalidate and refetch configs list
            queryClient.invalidateQueries({ queryKey: configKeys.lists() });
        },
        onError: (error) => {
            console.error("Failed to upsert config:", error);
        },
    });
};
