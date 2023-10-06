"use client";
import Link from "next/link";
import PostItem from "@/components/Dashboard/PostItem";
import axios from "@/utils/axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function Page() {
    const [posts, setPosts] = useState<any>(null);
    useEffect(() => {
        (async () => {
            try {
                const postsRes = await axios.get("/api/dashboard/post", {
                    params: {
                        op: "list",
                    },
                });
                setPosts(postsRes.data.data);
            } catch (error) {
                console.log("Error on fetching posts");
                toast.error("Error on fetching posts");
            }
        })();
    }, []);
    if (!posts) return null;
    return (
        <>
            <div className="px-2 py-2">
                <Link href={"/dashboard/main/posts/edit"}>
                    <p className="text-4xl bg-blue-900 text-white px-2 py-2">
                        New Post
                    </p>
                </Link>
            </div>
            <div className="grid grid-cols-4">
                {posts &&
                    posts
                        .filter(
                            (x: any) =>
                                x.deleted !== true && x.isPublished === false
                        )
                        .map((post: any) => (
                            <PostItem key={post.id} post={post} />
                        ))}
            </div>
        </>
    );
}
