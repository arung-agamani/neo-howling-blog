import axios from "@/utils/axios";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const usePostsQuery = () => {
    return useQuery({
        queryKey: ["posts"],
        queryFn: async () => {
            try {
                const response = await axios.get("/api/v1/posts");
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
