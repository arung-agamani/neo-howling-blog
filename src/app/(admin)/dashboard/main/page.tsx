"use client";

import axios from "@/utils/axios";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

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
    const [user, setUser] = useState<UserCred | null>(null);
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
                const { data } = await axios.get("/api/hello", {
                    withCredentials: true,
                });
                console.log(data);
                setUser(data);
            } catch (error) {
                if (error instanceof AxiosError) {
                    const e = error as AxiosError<{ message: string }>;
                    toast.error(
                        e.response?.data.message ||
                            "Error when fetching user credentials"
                    );
                }
            }
        })();
        (async () => {
            try {
                const { data } = await axios.get("/api/dashboard", {
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

        return () => {
            setUser(null);
        };
    }, []);
    if (!user) return <p>Fetching data...</p>;
    return (
        <div className="px-2 py-2">
            <h1 className="text-4xl">Hello, {user.user.username}!</h1>
            <p>Role: {user.user.role}</p>
            <p className="text-xl">Last Login: {new Date().toLocaleString()}</p>
            <p className="text-xl">
                You have {stats.total} posts, {stats.total - stats.unpublished}{" "}
                published, {stats.unpublished} draft
            </p>

            <br />
            <div className="flex">
                <div
                    id="col1"
                    className="bg-blue-900 px-2 py-2 mr-4 text-slate-300"
                >
                    <h2 className="text-2xl font-bold mb-2 text-slate-100">
                        Recent Posts
                    </h2>
                    {stats.recentPosts.map((post) => {
                        return (
                            <div
                                key={post.id}
                                className="shadow-md border border-slate-900 hover:border-slate-800 hover:bg-blue-700 px-2 py-2 mb-2"
                            >
                                <p className="text-xl">{post.title}</p>
                                <p className="text-md">{post.description}</p>
                                <p>
                                    <span className="underline text-blue-300 hover:text-blue-50 cursor-pointer">
                                        Open
                                    </span>{" "}
                                    <span className="underline text-blue-300 hover:text-blue-50 cursor-pointer">
                                        Edit
                                    </span>
                                </p>
                            </div>
                        );
                    })}
                </div>
                <div
                    id="col2"
                    className="bg-blue-900 px-2 py-2 mr-4 text-slate-300 flex-grow"
                >
                    <h2 className="text-2xl font-bold mb-2 text-slate-100">
                        Tags
                    </h2>
                    {/* <div className="flex flex-wrap justify-between">
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
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-slate-100">
                        Untagged Posts
                    </h2>
                    {stats.untaggedPosts.map((post) => {
                        return (
                            <div
                                key={post.id}
                                className="border border-slate-900 hover:border-slate-800 hover:bg-blue-700 px-2 py-2 mb-2"
                            >
                                <p className="text-xl">{post.title}</p>
                                <p className="text-md">{post.description}</p>
                                <p>
                                    <span className="underline text-blue-300 hover:text-blue-50 cursor-pointer">
                                        Open
                                    </span>{" "}
                                    <span className="underline text-blue-300 hover:text-blue-50 cursor-pointer">
                                        Edit
                                    </span>
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
