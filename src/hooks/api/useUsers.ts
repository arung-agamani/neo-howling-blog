import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/utils/axios";

export interface User {
    id: string;
    username: string;
    name?: string;
    email?: string;
    role: string;
    birthday?: string;
    gender?: string;
    phone?: string;
}

export interface UsersResponse {
    users: User[];
}

export interface CreateUserPayload {
    username: string;
    password: string;
    confirmPassword: string;
    name?: string;
    email?: string;
    role: string;
    birthday?: string;
    gender?: string;
    phone?: string;
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {
    id: string;
}

// Query key factory for users
export const usersKeys = {
    all: ["users"] as const,
    lists: () => [...usersKeys.all, "list"] as const,
    list: (filters: Record<string, any>) => [...usersKeys.lists(), filters] as const,
    details: () => [...usersKeys.all, "detail"] as const,
    detail: (id: string) => [...usersKeys.details(), id] as const,
    byUsername: (username: string) => [...usersKeys.all, "username", username] as const,
};

// Fetch users function
const fetchUsers = async (): Promise<User[]> => {
    const response = await axios.get<UsersResponse>("/api/v1/users");
    return response.data.users || [];
};

// Fetch single user function
const fetchUser = async (id: string): Promise<User> => {
    const response = await axios.get<User>(`/api/v1/users/${id}`);
    return response.data;
};

// Fetch user by username function
const fetchUserByUsername = async (username: string): Promise<User> => {
    const response = await axios.get<User>(`/api/v1/users?username=${username}`);
    return response.data;
};

// Create user function
const createUser = async (payload: CreateUserPayload): Promise<User> => {
    const response = await axios.post<{ success: boolean; data: User }>("/api/v1/users", payload);
    return response.data.data;
};

// Update user function
const updateUser = async (payload: UpdateUserPayload): Promise<User> => {
    const { id, ...updateData } = payload;
    const response = await axios.put<{ success: boolean; data: User }>(`/api/v1/users/${id}`, updateData);
    return response.data.data;
};

// Delete user function
const deleteUser = async (id: string): Promise<void> => {
    await axios.delete(`/api/v1/users/${id}`);
};

// React Query hook for fetching all users
export const useUsers = () => {
    return useQuery({
        queryKey: usersKeys.lists(),
        queryFn: fetchUsers,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
        refetchOnWindowFocus: false,
        retry: 3,
    });
};

// React Query hook for fetching a single user
export const useUser = (id: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: usersKeys.detail(id),
        queryFn: () => fetchUser(id),
        enabled: enabled && !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 3,
    });
};

// React Query hook for fetching user by username
export const useUserByUsername = (username: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: usersKeys.byUsername(username),
        queryFn: () => fetchUserByUsername(username),
        enabled: enabled && !!username,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 3,
    });
};

// React Query mutation hook for creating users
export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createUser,
        onSuccess: (newUser) => {
            // Invalidate and refetch users list
            queryClient.invalidateQueries({ queryKey: usersKeys.lists() });

            // Add the new user to the cache
            queryClient.setQueryData(usersKeys.detail(newUser.id), newUser);

            // Invalidate dashboard stats if they depend on user count
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
        onError: (error) => {
            console.error("Failed to create user:", error);
        },
    });
};

// React Query mutation hook for updating users
export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateUser,
        onSuccess: (updatedUser) => {
            // Update the user in the detail cache
            queryClient.setQueryData(usersKeys.detail(updatedUser.id), updatedUser);

            // Update username cache if username changed
            queryClient.setQueryData(usersKeys.byUsername(updatedUser.username), updatedUser);

            // Invalidate users list to reflect changes
            queryClient.invalidateQueries({ queryKey: usersKeys.lists() });

            // Invalidate dashboard stats
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
        onError: (error) => {
            console.error("Failed to update user:", error);
        },
    });
};

// React Query mutation hook for deleting users
export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteUser,
        onSuccess: (_, deletedId) => {
            // Remove the user from all relevant caches
            queryClient.removeQueries({ queryKey: usersKeys.detail(deletedId) });

            // Invalidate users list
            queryClient.invalidateQueries({ queryKey: usersKeys.lists() });

            // Invalidate dashboard stats
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
        onError: (error) => {
            console.error("Failed to delete user:", error);
        },
    });
};

// Hook for prefetching users (useful for navigation)
export const usePrefetchUsers = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.prefetchQuery({
            queryKey: usersKeys.lists(),
            queryFn: fetchUsers,
            staleTime: 5 * 60 * 1000,
        });
    };
};

// Hook for prefetching a single user
export const usePrefetchUser = () => {
    const queryClient = useQueryClient();

    return (id: string) => {
        queryClient.prefetchQuery({
            queryKey: usersKeys.detail(id),
            queryFn: () => fetchUser(id),
            staleTime: 10 * 60 * 1000,
        });
    };
};

// Hook for invalidating users cache (useful after external changes)
export const useInvalidateUsers = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({
            queryKey: usersKeys.all,
        });
    };
};

// Hook for optimistic updates
export const useOptimisticUserUpdate = () => {
    const queryClient = useQueryClient();

    return (id: string, updater: (old: User) => User) => {
        queryClient.setQueryData(usersKeys.detail(id), updater);
    };
};

// Hook for role-based filtering (client-side)
export const useUsersByRole = (role?: string) => {
    const { data: users, ...query } = useUsers();

    const filteredUsers = users?.filter(user =>
        !role || role === "all" || user.role === role
    ) || [];

    return {
        ...query,
        data: filteredUsers,
    };
};
