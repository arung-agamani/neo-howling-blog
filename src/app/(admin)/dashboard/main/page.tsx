"use client";

import axios from "@/utils/axios";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import PostItem from "@/components/Dashboard/PostItem";
import PostItemSkeleton from "@/components/Dashboard/PostItemSkeleton";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import { useAppSelector } from "@/stores/hooks";

interface UserCred {
    user: {
        role?: string;
        username: string;
    };
}

interface RecentPost {
    id: string;
    title: string;
    description: string;
}

interface Tag {
    name: string;
    _sum: {
        count: number;
    };
}

interface Stats {
    total: number;
    unpublished: number;
    recentPosts: RecentPost[];
    untaggedPosts: RecentPost[];
    tags: Tag[];
}

export default function Page() {
    const user = useAppSelector((state) => state.user);
    const [stats, setStats] = useState<Stats>({
        total: -1,
        unpublished: -1,
        recentPosts: [],
        untaggedPosts: [],
        tags: [],
    });
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get("/api/dashboardv2", {
                    withCredentials: true,
                });
                setStats(data.stats);
            } catch (error) {
                if (error instanceof AxiosError) {
                    const e = error as AxiosError<{ message: string }>;
                    toast.error(
                        e.response?.data.message ||
                            "Error when fetching statistics"
                    );
                }
            }
        })();
    }, []);
    if (!user)
        return (
            <Grid
                container
                spacing={0}
                direction="column"
                alignItems="center"
                justifyContent="center"
                sx={{
                    minHeight: "100vh",
                    backgroundColor: "white",
                }}
            >
                <CircularProgress color="primary" />
            </Grid>
        );
    return (
        <div className="px-4 py-4">
            <Paper elevation={2} className="px-4 py-4">
                <Typography variant="h4">Hello, {user.username}!</Typography>
                <Typography variant="body1">
                    Last Login: {new Date().toLocaleString()}
                </Typography>
                <Typography variant="body1">
                    You have {stats.total} posts,{" "}
                    {stats.total - stats.unpublished} published,{" "}
                    {stats.unpublished} draft
                </Typography>
            </Paper>

            <br />
            <Stack spacing={2}>
                <Paper elevation={2} className="px-4 py-4">
                    <Typography variant="h5">Recent Post</Typography>
                    <Divider />
                    <div className="grid grid-cols-5 gap-4 py-2">
                        {stats.total === -1
                            ? [0, 1, 2, 3, 4].map((i) => {
                                  return <PostItemSkeleton key={i} />;
                              })
                            : stats.recentPosts.map((post) => {
                                  return (
                                      <PostItem
                                          key={post.id}
                                          post={post as any}
                                      />
                                  );
                              })}
                    </div>
                </Paper>
                <Paper elevation={2} className="px-4 py-4">
                    {/* <Typography variant="h4">Tags</Typography>
                    <div className="grid grid-cols-5">
                        {stats.tags.slice(0, 10).map((tag) => {
                            return (
                                <div
                                    key={tag.name}
                                    className="mr-2 border border-slate-900 hover:border-slate-800 hover:bg-blue-700 px-2 py-2 mb-2"
                                >
                                    <p className="text-xl">{tag.name}</p>
                                    <p className="text-md">
                                        Total: {tag._sum.count}
                                    </p>
                                    <p>
                                        <span className="underline text-blue-300 hover:text-blue-50 cursor-pointer">
                                            Open
                                        </span>
                                    </p>
                                </div>
                            );
                        })}
                    </div> */}
                    <Typography variant="h5">Untagged Post</Typography>
                    <Divider />
                    <div className="grid grid-cols-5 gap-4 py-2">
                        {stats.total === -1
                            ? [0, 1, 2, 3, 4].map((i) => {
                                  return <PostItemSkeleton key={i} />;
                              })
                            : stats.untaggedPosts.map((post) => {
                                  return (
                                      <PostItem
                                          key={post.id}
                                          post={post as any}
                                      />
                                  );
                              })}
                    </div>
                </Paper>
            </Stack>
        </div>
    );
}
