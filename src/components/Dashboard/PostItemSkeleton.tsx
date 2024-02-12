"use client";

import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PostData {
    title: string;
    link: string | null;
    tags: string[];
    description: string;
    bannerUrl: string | null;
    isBannerDark: boolean | null;
    isPublished: boolean | null;
    datePosted: Date;
    id: string;
    updatedAt?: Date;
    deleted?: boolean;
    deletedAt?: Date;
}

const PostItemSkeleton: React.FC = () => {
    return (
        <Card
            className="flex flex-col bg-gray-100"
            sx={{
                // color: "#0B132B",
                "& .MuiSvgIcon-root": {
                    color: "#947EB0",
                },
                backgroundColor: "rgb(243 244 246)",
            }}
        >
            <CardContent className="flex-grow">
                <Typography color="text.secondary" gutterBottom>
                    <Skeleton />
                </Typography>
                <Typography variant="h5" component="div" color="text.primary">
                    <Skeleton />{" "}
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ marginTop: "1rem" }}
                >
                    <Skeleton />{" "}
                </Typography>
                {/* <div className="mt-6">
                    {post.tags.map((tag) => (
                        <Chip
                            key={tag}
                            className="mx-1 first:ml-0"
                            label={tag}
                        />
                    ))}
                </div> */}
            </CardContent>
        </Card>
    );
};

export default PostItemSkeleton;
