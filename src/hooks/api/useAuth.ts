import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import axios from "@/utils/axios";

export interface CurrentUser {
    id: string;
    username: string;
    name?: string;
    role: string;
    birthday?: string;
    gender?: string;
    phone?: string;
}

export interface AuthResponse {
    user: CurrentUser;
}

// Query key factory for auth
export const authKeys = {
    all: ["auth"] as const,
    me: () => [...authKeys.all, "me"] as const,
};

// Fetch current user function
const fetchCurrentUser = async (): Promise<CurrentUser> => {
    const response = await axios.get<AuthResponse>("/api/v1/auth/me");
    return response.data.user;
};

// Logout function
const logout = async (): Promise<void> => {
    await signOut({ callbackUrl: "/admin" });
};

// React Query hook for fetching current user
export const useCurrentUser = () => {
    return useQuery({
        queryKey: authKeys.me(),
        queryFn: fetchCurrentUser,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
            // Don't retry on 401 errors (unauthorized)
            if (error?.response?.status === 401) {
                return false;
            }
            return failureCount < 3;
        },
    });
};

// React Query mutation hook for logout
export const useLogout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: logout,
        onSuccess: () => {
            // Clear all query cache on logout
            queryClient.clear();
        },
        onError: (error) => {
            console.error("Failed to logout:", error);
        },
    });
};

// Hook for invalidating auth cache
export const useInvalidateAuth = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({
            queryKey: authKeys.all,
        });
    };
};

// Hook to get display name with fallback
export const useDisplayName = () => {
    const { data: user } = useCurrentUser();

    return user?.name || user?.username || "User";
};

// Hook to check if user has specific role
export const useHasRole = (role: string | string[]) => {
    const { data: user } = useCurrentUser();

    if (!user) return false;

    if (Array.isArray(role)) {
        return role.includes(user.role);
    }

    return user.role === role;
};

// Hook to check if user is admin
export const useIsAdmin = () => {
    return useHasRole("admin");
};

// Hook to check if user can edit (admin or editor)
export const useCanEdit = () => {
    return useHasRole(["admin", "editor"]);
};
