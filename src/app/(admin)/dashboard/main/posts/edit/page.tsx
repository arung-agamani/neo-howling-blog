/* eslint-disable @next/next/no-img-element */
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import { toast } from "react-toastify";
import axios from "@/utils/axios";
import debounce from "lodash.debounce";

// import "./editor.css";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/Dashboard/Editor"), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});

interface PostMetadata {
    author?: string;
    title?: string;
    description?: string;
    bannerUrl?: string;
    tags?: string[];
}

export default function Page() {
    const [content, setContent] = useState("");
    const [page, setPage] = useState<PostMetadata>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [isModified, setIsModified] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const titleInputRef = useRef<HTMLTextAreaElement>(null);
    const descInputRef = useRef<HTMLTextAreaElement>(null);
    const bannerUrlRef = useRef<HTMLTextAreaElement>(null);
    const imagePrevRef = useRef<HTMLImageElement>(null);
    const tagsRef = useRef<HTMLTextAreaElement>(null);

    const router = useRouter();

    const searchParams = useSearchParams();
    useEffect(() => {
        (async () => {
            if (!searchParams) return setLoading(false);
            const id = searchParams.get("id");
            if (!id) return setLoading(false);

            try {
                const res = await axios.get("/api/dashboardv2/post/get", {
                    params: {
                        id,
                    },
                });
                setContent(res.data.blogContent);
                console.log(res.data);
                setPage(res.data);
                setIsSynced(true);
            } catch (error) {
                setContent("<h1>Failed to fetch content</h1>");
            } finally {
                setLoading(false);
            }
        })();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const previewBannerUrl = () => {
        if (!bannerUrlRef.current) return;

        fetch(bannerUrlRef.current.value, { method: "HEAD" })
            .then((res) => res.headers.get("content-type")?.startsWith("image"))
            .then(() => {
                const img = imagePrevRef.current;
                if (!img) return;
                img.src = bannerUrlRef.current!.value;
                img.className = "w-full h-auto";
            })
            .catch(() => {
                const img = imagePrevRef.current;
                if (!img) return;
                img.className = "hidden";
            });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const saveHandler = async () => {
        const url = new URL(window.location.href);
        const id = url.searchParams!.get("id");
        let op: "update" | "create" = "update";
        if (!id) op = "create";
        if (op === "update") {
            try {
                const res = await axios.post("/api/dashboardv2/post/update", {
                    id,
                    op: "update",
                    blogContent: content,
                    title: titleInputRef.current?.value,
                    description: descInputRef.current?.value,
                    bannerUrl: bannerUrlRef.current?.value,
                    tags: tagsRef.current?.value.split(","),
                });
                setIsSynced(true);
                setIsModified(false);
                toast.success("Post updated!", {
                    position: toast.POSITION.TOP_CENTER,
                    autoClose: 3000,
                    closeOnClick: true,
                    theme: "light",
                });
            } catch (e) {
                console.error(e);
                toast.error("Post updating failed");
            }
        } else if (op === "create") {
            try {
                const res = await axios.post("/api/dashboardv2/post/create", {
                    author: "Shirayuki Haruka",
                    op,
                    blogContent: content,
                    datePosted: new Date(),
                    description: descInputRef.current?.value,
                    link: "",
                    tags: [],
                    title: titleInputRef.current?.value,
                });
                // console.log(res.status);
                setIsSynced(true);
                setIsModified(false);
                toast.success("Post created!");
                setTimeout(() => {
                    router.push(
                        `/dashboard/main/posts/edit?id=${res.data.data.id}`
                    );
                }, 3000);
                // console.log(res.data);
            } catch (e) {
                console.log(e);
                toast.error("Post creation failed");
            }
        }
    };

    //   useEffect(() => {
    //     saveHandler(content);
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    //   }, [content]);
    if (loading) return <h1>Loading...</h1>;
    return (
        <>
            <div
                className="flex"
                style={{
                    height: "calc(100vh - 64px)",
                }}
            >
                <div className="flex-grow bg-white">
                    <Editor
                        {...{
                            page,
                            setPage,
                            content,
                            setContent,
                            isModified,
                            setIsModified,
                            isSynced,
                            setIsSynced,
                        }}
                    />
                </div>
                <div className="py-2 bg-white text-black sticky h-full top-0 flex flex-col w-full max-w-xs">
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
                        <label htmlFor="" className="text-xl">
                            Tags
                        </label>
                        <textarea
                            name="tags"
                            className="border border-slate-400 rounded-lg px-2 py-1 w-full"
                            ref={tagsRef}
                            wrap="soft"
                            defaultValue={page.tags?.join(",")}
                        />
                        <img
                            src=""
                            alt=""
                            id="bannerPreview"
                            ref={imagePrevRef}
                            className="hidden"
                        />
                    </div>

                    <div className="flex flex-col gap-2 mb-4 mx-4">
                        {isModified ? (
                            <Chip
                                label="Modified"
                                color="error"
                                className="font-bold px-2 py-2 text-center"
                            />
                        ) : (
                            <Chip
                                label="Not Modified"
                                color="success"
                                className="font-bold px-2 py-2 text-center"
                            />
                        )}
                        {isSynced ? (
                            <Chip
                                label="Synced"
                                color="success"
                                className="font-bold px-2 py-2 text-center"
                            />
                        ) : (
                            <Chip
                                label="Not Synced"
                                color="error"
                                className="font-bold px-2 py-2 text-center"
                            />
                        )}
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                            onClick={saveHandler}
                            sx={{
                                padding: "0.5rem 1rem",
                                fontWeight: "bold",
                                textTransform: "none",
                            }}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
