/* eslint-disable @next/next/no-img-element */
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import { toast } from "react-toastify";
import axios from "@/utils/axios";

// import "./editor.css";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

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
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
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
                {/* Collapse/Expand Button */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        background: "#fff",
                        borderLeft: "1px solid #eee",
                        minWidth: "24px",
                        cursor: "pointer",
                        userSelect: "none",
                    }}
                >
                    <button
                        aria-label={
                            rightPanelOpen ? "Collapse panel" : "Expand panel"
                        }
                        onClick={() => setRightPanelOpen((v) => !v)}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "8px",
                            cursor: "pointer",
                            fontSize: "1.2rem",
                        }}
                    >
                        {rightPanelOpen ? "⮞" : "⮜"}
                    </button>
                </div>
                {/* Right Panel */}
                {rightPanelOpen && (
                    <div
                        className="sticky h-full top-0 flex flex-col w-full max-w-xs bg-white"
                        id="right-panel"
                        style={{
                            paddingTop: 16,
                            paddingBottom: 16,
                            color: "inherit",
                            minWidth: 0,
                        }}
                    >
                        <Box className="mx-2 pb-4" sx={{ flex: 1 }}>
                            <TextField
                                label="Title"
                                name="title"
                                inputRef={titleInputRef}
                                defaultValue={page.title}
                                multiline
                                minRows={2}
                                fullWidth
                                margin="dense"
                                variant="outlined"
                                onChange={() => setIsModified(true)}
                            />
                            <TextField
                                label="Description"
                                name="description"
                                inputRef={descInputRef}
                                defaultValue={page.description}
                                multiline
                                minRows={2}
                                fullWidth
                                margin="dense"
                                variant="outlined"
                                onChange={() => setIsModified(true)}
                            />
                            <TextField
                                label="Banner"
                                name="bannerUrl"
                                inputRef={bannerUrlRef}
                                defaultValue={page.bannerUrl}
                                multiline
                                minRows={2}
                                fullWidth
                                margin="dense"
                                variant="outlined"
                                onChange={(e) => {
                                    previewBannerUrl();
                                    setIsModified(true);
                                }}
                            />
                            <TextField
                                label="Tags"
                                name="tags"
                                inputRef={tagsRef}
                                defaultValue={page.tags?.join(",")}
                                multiline
                                minRows={2}
                                fullWidth
                                margin="dense"
                                variant="outlined"
                                onChange={() => setIsModified(true)}
                            />
                            <img
                                src=""
                                alt=""
                                id="bannerPreview"
                                ref={imagePrevRef}
                                className="hidden"
                                style={{ marginTop: 8 }}
                            />
                        </Box>
                        <Box className="flex flex-col gap-2 mb-4 mx-4">
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
                        </Box>
                    </div>
                )}
            </div>
        </>
    );
}
