"use client";

import axios from "@/utils/axios";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { toast } from "react-toastify";

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
}

const PostItem: React.FC<{ post: PostData }> = ({ post }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [popupMenu, setPopupMenu] = useState<HTMLDivElement | null>(null);
    const openOption = () => {
        if (popupMenu) {
            popupMenu.remove();
            setPopupMenu(null);
            return;
        }
        console.log(post.id);
        const popupDiv = document.createElement("div");
        const ul = document.createElement("ul");
        popupDiv.appendChild(ul);
        ["item1", "item2", "item3"].map((item) => {
            const el = document.createElement("li");
            el.innerText = item;
            el.className = "px-2 py-2 hover:bg-slate-300 w-20";
            ul.addEventListener("click", (e) => {
                e.preventDefault();
                console.log(item);
            });
            ul.appendChild(el);
        });
        popupDiv.style.position = "absolute";
        popupDiv.className =
            "border border-slate-700 bg-slate-50 text-slate-800";
        ref.current?.appendChild(popupDiv);
        setPopupMenu(popupDiv);
    };

    const deleteHandler = async (id: string) => {
        try {
            const deleteRes = await axios.delete(
                `/api/dashboard/post?id=${id}`
            );
            toast.success("Post deleted!", {
                position: toast.POSITION.TOP_LEFT,
            });
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error) {
            console.log("Error when deleting post");
            console.error(error);
            toast.error("Error when deleting post");
        }
    };

    const publishHandler = async () => {
        try {
            const publishRes = await axios.post(`/api/dashboard/post`, {
                id: post.id,
                publish: !post.isPublished,
                op: "publish",
            });
            let msg = post.isPublished ? "Post unpublished" : "Post published";
            toast.success(msg, {
                position: toast.POSITION.TOP_LEFT,
            });
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error) {
            console.log("Error when (un)publishing post");
            console.error(error);
            toast.error("Error when (un)publishing post");
        }
    };
    return (
        <div
            className="bg-slate-600 text-slate-100 mb-2 flex mx-2"
            key={post.title}
        >
            <div
                className="h-full px-2 self-center hover:cursor-pointer"
                // onClick={openOption}
                ref={ref}
            >
                <svg
                    style={{
                        verticalAlign: "-0.125em",
                    }}
                    fill="currentColor"
                    height="1em"
                    width="1em"
                    viewBox="0 0 192 512"
                    aria-hidden="true"
                    role="img"
                >
                    <path
                        d="M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z"
                        transform=""
                    ></path>
                </svg>
            </div>
            <div className="py-4 px-2 pl-4 border-l border-slate-600 bg-slate-700 w-full">
                <p className="text-2xl">{post.title}</p>
                <p className="text-md mb-3 text-slate-300">
                    {post.description}
                </p>
                <p>
                    <Link
                        href={`/post/${post.id}`}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <span className="mr-4 font-bold bg-blue-600 px-2 text py-0.5 rounded-lg text-slate-100 hover:bg-white hover:cursor-pointer">
                            Open
                        </span>
                    </Link>
                    <Link
                        href={{
                            pathname: "/dashboard/main/posts/edit",
                            query: {
                                id: post.id,
                            },
                        }}
                    >
                        <span className="mr-4 font-bold bg-orange-600 px-2 text py-0.5 rounded-lg text-slate-100 hover:bg-white hover:cursor-pointer">
                            Edit
                        </span>
                    </Link>
                    <span
                        className="mr-4 font-bold bg-red-600 px-2 text py-0.5 rounded-lg text-slate-100 hover:bg-white hover:cursor-pointer"
                        // onClick={() => deleteHandler(post.id)}
                    >
                        Delete
                    </span>
                    {post.isPublished ? (
                        <span
                            className="mr-4 font-semibold text-slate-100 px-2 text py-0.5 rounded-lg bg-green-500 hover:cursor-pointer"
                            onClick={publishHandler}
                        >
                            Published
                        </span>
                    ) : (
                        <span
                            className="mr-4 font-semibold text-slate-100 px-2 text py-0.5 rounded-lg bg-gray-500 hover:cursor-pointer"
                            onClick={publishHandler}
                        >
                            Not Published
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
};

export default PostItem;
