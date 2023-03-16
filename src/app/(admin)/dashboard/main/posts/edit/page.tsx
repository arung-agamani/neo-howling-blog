/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import { toast } from "react-toastify";
import axios from "@/utils/axios";
import "react-quill/dist/quill.snow.css";
import "./editor.css";

interface PostMetadata {
    author?: string;
    title?: string;
    description?: string;
    bannerUrl?: string;
}

export default function Page() {
    const [content, setContent] = useState("");
    const [page, setPage] = useState<PostMetadata>({});
    const [isModified, setIsModified] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const titleInputRef = useRef<HTMLTextAreaElement>(null);
    const descInputRef = useRef<HTMLTextAreaElement>(null);
    const bannerUrlRef = useRef<HTMLTextAreaElement>(null);
    const searchParams = useSearchParams();
    useEffect(() => {
        (async () => {
            const id = searchParams.get("id");
            if (!id) return;

            try {
                const res = await axios.get("/api/dashboard/post", {
                    params: {
                        id,
                    },
                });
                setContent(res.data.data.page.blogContent);
                console.log(res.data.data.page);
                setPage(res.data.data.page);
                setIsSynced(true);
            } catch (error) {
                setContent("<h1>Failed to fetch content</h1>");
            }
        })();

        const toolbarHeight =
            document.getElementsByClassName("ql-toolbar")[0].clientHeight;
        const qlContainer = document.getElementsByClassName(
            "ql-container"
        )[0] as HTMLDivElement;
        qlContainer.style.maxHeight = `${window.innerHeight - toolbarHeight}px`;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const previewBannerUrl = () => {
        if (!bannerUrlRef.current) return;

        fetch(bannerUrlRef.current.value, { method: "HEAD" })
            .then((res) => res.headers.get("content-type")?.startsWith("image"))
            .then(() => {
                const img = document.getElementById(
                    "bannerPreview"
                ) as HTMLImageElement;
                img.src = bannerUrlRef.current!.value;
                img.className = "w-full h-auto";
            })
            .catch(() => {
                const img = document.getElementById(
                    "bannerPreview"
                ) as HTMLImageElement;
                img.className = "hidden";
            });
    };

    const saveHandler = async () => {
        const id = searchParams.get("id");
        let op: "update" | "create" = "update";
        if (!id) op = "create";

        if (op === "update") {
            try {
                const res = await axios.post("/api/dashboard/post", {
                    id,
                    op: "update",
                    content,
                    title: titleInputRef.current?.value,
                    description: descInputRef.current?.value,
                    bannerUrl: bannerUrlRef.current?.value,
                });
                if (res.status == 200) {
                    setIsSynced(true);
                    setIsModified(false);
                    toast.success("Post updated!", {
                        position: toast.POSITION.TOP_CENTER,
                        autoClose: 3000,
                        closeOnClick: true,
                        theme: "light",
                    });
                    return;
                }
            } catch (e) {
                console.error(e);
                toast.error("Post updating failed");
                return;
            }
        } else if (op === "create") {
            try {
                const res = await axios.post("/api/dashboard/post", {
                    author: "Shirayuki Haruka",
                    op,
                    content,
                    datePosted: new Date(),
                    description: descInputRef.current?.value,
                    link: "",
                    tags: [],
                    title: titleInputRef.current?.value,
                });

                if (res.status == 200) {
                    setIsSynced(true);
                    setIsModified(false);
                    toast.success("Post created!");
                    // setTimeout(() => {
                    //     router.push(`/dashboard/main/posts/edit?id=${res.data.}`)
                    // }, 3000);
                    console.log(res.data);
                    return;
                }
            } catch (e) {
                console.error(e);
                toast.error("Post creation failed");
                return;
            }
        }
    };
    return (
        <>
            <div className="flex">
                <div className="flex-grow">
                    <ReactQuill
                        className="bg-white post h-full overflow-y-hidden"
                        value={content}
                        onBlur={(p, s, e) => {
                            setContent(e.getHTML());
                            setIsSynced(true);
                        }}
                        onChange={() => {
                            setIsSynced(false);
                            setIsModified(true);
                        }}
                    />
                </div>
                <div className="py-2 bg-white text-black sticky h-screen top-0 flex flex-col w-full max-w-xs">
                    <div className="mx-2 pb-4">
                        <label className="text-xl">Title</label>
                        <textarea
                            name="title"
                            className="border border-slate-400 rounded-lg px-2 py-1 w-full"
                            ref={titleInputRef}
                            defaultValue={page.title}
                            wrap="soft"
                        />
                        <label className="text-xl">Description</label>
                        <textarea
                            name="description"
                            className="border border-slate-400 rounded-lg px-2 py-1 w-full"
                            ref={descInputRef}
                            defaultValue={page.description}
                            wrap="soft"
                        />
                        <label htmlFor="" className="text-xl">
                            Banner
                        </label>
                        <textarea
                            name="bannerUrl"
                            id=""
                            className="border border-slate-400 rounded-lg px-2 py-1 w-full"
                            ref={bannerUrlRef}
                            wrap="soft"
                            defaultValue={page.bannerUrl}
                            onChange={previewBannerUrl}
                        />
                        <img
                            src=""
                            alt=""
                            id="bannerPreview"
                            className="hidden"
                        />
                    </div>

                    {isModified ? (
                        <span className="font-bold px-2 py-2 text-center bg-red-500">
                            Modified
                        </span>
                    ) : (
                        <span className="font-bold px-2 py-2 text-center bg-green-500">
                            Not modified
                        </span>
                    )}
                    {isSynced ? (
                        <span className="font-bold px-2 py-2 text-center bg-green-500">
                            Synced
                        </span>
                    ) : (
                        <span className="font-bold px-2 py-2 text-center bg-red-500">
                            Not synced
                        </span>
                    )}
                    {["Save"].map((x) => (
                        <button
                            className="px-2 py-2 bg-blue-400 hover:bg-blue-200 w-full text-white"
                            key={x}
                            onClick={saveHandler}
                        >
                            {x}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
