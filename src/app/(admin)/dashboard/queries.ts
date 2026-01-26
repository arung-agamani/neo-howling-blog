import { emptyHelloResponse, HelloResponse } from "@/types";
import axios from "@/utils/axios";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const usePostsQuery = () => {
    return useQuery({
        queryKey: ["posts"],
        queryFn: async () => {
            try {
                const response = await axios.get(
                    "/api/v1/posts?includeDiary=true&pageSize=1000",
                );
                return response.data.data;
            } catch (error) {
                console.error("Error fetching posts:", error);
                toast.error("Error fetching posts");
                return [];
            }
        },
        placeholderData: [],
    });
};

export const useCurrentUserQuery = () => {
    return useQuery({
        queryKey: ["user", "me"],
        queryFn: async () => {
            const res = await axios.get("/api/v1/auth/me", {
                withCredentials: true,
            });
            const validated = HelloResponse.safeParse(res.data);
            if (!validated.success) {
                return emptyHelloResponse.user;
            }
            return validated.data.user;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: true,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
