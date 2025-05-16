"use client";
import { useQuery } from "@tanstack/react-query";
import { Divider, Typography } from "@mui/material";
import ReprocessTagsButton from "./ReprocessTagsButton";
import TagsTable from "./Table";

export default function TagsPage() {
    const { data: tags = [], isLoading } = useQuery({
        queryKey: ["tags"],
        queryFn: async () => {
            const res = await fetch("/api/dashboardv2/tag");
            if (!res.ok) throw new Error("Failed to fetch tags");
            return res.json();
        },
    });

    return (
        <div className="bg-white w-full h-full p-8">
            <Typography variant="h3">Tags</Typography>
            <Divider />
            <div className="mt-4">
                <ReprocessTagsButton />
            </div>
            <div className="mt-4">
                {isLoading ? (
                    <Typography>Loading...</Typography>
                ) : (
                    <TagsTable tags={tags} />
                )}
            </div>
        </div>
    );
}
