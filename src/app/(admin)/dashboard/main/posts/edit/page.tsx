"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import { toast } from "react-toastify";
import axios from "@/utils/axios";

import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { PostMetadata } from "@/types";
import { APP_BAR_HEIGHT } from "@/constants";
import Typography from "@/components/Typography";
import { Dialog, DialogContent } from "@mui/material";
import { MediaLibrary } from "@/components/Dashboard/MediaLibrary";

const Editor = dynamic(() => import("@/components/Dashboard/Editor"), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});

export default function Page() {
    const [content, setContent] = useState("");
    const [page, setPage] = useState<PostMetadata>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [mediaLibOpen, setMediaLibOpen] = useState(false);

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
                const res = await axios.get("/api/v1/posts/" + id);
                setContent(res.data.blogContent);
                setPage(res.data);
            } catch (error) {
                console.error("Failed to fetch post:", error);
                setContent("<h1>Failed to fetch content</h1>");
            } finally {
                setLoading(false);
            }
        })();
    }, [searchParams]);

    const previewBannerUrl = useCallback(() => {
        if (!bannerUrlRef.current) return;

        const url = bannerUrlRef.current.value;
        if (!url) {
            if (imagePrevRef.current) {
                imagePrevRef.current.className = "hidden";
            }
            return;
        }

        fetch(url, { method: "HEAD" })
            .then((res) => {
                const contentType = res.headers.get("content-type");
                const isImage = contentType?.startsWith("image");

                if (isImage && imagePrevRef.current) {
                    imagePrevRef.current.src = url;
                    imagePrevRef.current.className = "w-full h-auto";
                } else if (imagePrevRef.current) {
                    imagePrevRef.current.className = "hidden";
                }
            })
            .catch(() => {
                if (imagePrevRef.current) {
                    imagePrevRef.current.className = "hidden";
                }
            });
    }, []);

    const saveHandler = useCallback(async () => {
        const id = searchParams?.get("id");
        const isUpdate = !!id;

        setIsSaving(true);

        try {
            if (isUpdate) {
                await axios.patch("/api/v1/posts/" + id, {
                    id,
                    op: "update",
                    blogContent: content,
                    title: titleInputRef.current?.value,
                    description: descInputRef.current?.value,
                    bannerUrl: bannerUrlRef.current?.value,
                    tags: tagsRef.current?.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                });

                setHasUnsavedChanges(false);
                toast.success("Post updated!", {
                    position: "top-center",
                    autoClose: 3000,
                    closeOnClick: true,
                    theme: "light",
                });
            } else {
                const res = await axios.post("/api/v1/posts", {
                    author: page.author || "Shirayuki Haruka", // TODO: Get from auth context
                    blogContent: content,
                    description: descInputRef.current?.value,
                    tags: tagsRef.current?.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    title: titleInputRef.current?.value,
                });

                setHasUnsavedChanges(false);
                toast.success("Post created!", {
                    onClose: () => {
                        router.push(
                            `/dashboard/main/posts/edit?id=${res.data.data.id}`,
                        );
                    },
                    autoClose: 2000,
                });
            }
        } catch (error) {
            console.error("Save failed:", error);
            toast.error(
                isUpdate ? "Post updating failed" : "Post creation failed",
            );
        } finally {
            setIsSaving(false);
        }
    }, [searchParams, content, page.author, router]);

    if (loading) return <h1>Loading...</h1>;

    return (
        <div
            className="flex"
            style={{
                height: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
            }}
        >
            <div className="flex-grow bg-white">
                <Editor
                    page={page}
                    setPage={setPage}
                    content={content}
                    setContent={setContent}
                    setHasUnsavedChanges={setHasUnsavedChanges}
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
                            onChange={() => setHasUnsavedChanges(true)}
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
                            onChange={() => setHasUnsavedChanges(true)}
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
                            onChange={() => {
                                previewBannerUrl();
                                setHasUnsavedChanges(true);
                            }}
                        />
                        <TextField
                            label="Tags"
                            name="tags"
                            inputRef={tagsRef}
                            defaultValue={page.tags?.join(", ")}
                            multiline
                            minRows={2}
                            fullWidth
                            margin="dense"
                            variant="outlined"
                            onChange={() => setHasUnsavedChanges(true)}
                        />
                        <img
                            src={page.bannerUrl || undefined}
                            alt=""
                            id="bannerPreview"
                            ref={imagePrevRef}
                            className={
                                page.bannerUrl ? "w-full h-auto" : "hidden"
                            }
                            style={{ marginTop: 8 }}
                        />
                    </Box>
                    <Typography.Divider />
                    <Box className="flex flex-col gap-y-2 mx-4 my-4">
                        <Button
                            variant="contained"
                            onClick={() => {
                                setMediaLibOpen(true);
                            }}
                        >
                            Media Library
                        </Button>
                    </Box>
                    <Typography.Divider />
                    <Box className="flex flex-col gap-2 mb-4 mx-4">
                        <Chip
                            label={
                                hasUnsavedChanges
                                    ? "Unsaved Changes"
                                    : "All Changes Saved"
                            }
                            color={hasUnsavedChanges ? "warning" : "success"}
                            className="font-bold px-2 py-2 text-center"
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                            onClick={saveHandler}
                            disabled={isSaving}
                            sx={{
                                padding: "0.5rem 1rem",
                                fontWeight: "bold",
                                textTransform: "none",
                            }}
                        >
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </Box>
                </div>
            )}
            <Dialog
                open={mediaLibOpen}
                onClose={() => {
                    setMediaLibOpen(false);
                }}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        height: "90vh",
                        maxHeight: "90vh",
                    },
                }}
            >
                <DialogContent sx={{ p: 0, height: "100%" }}>
                    <MediaLibrary />
                </DialogContent>
            </Dialog>
        </div>
    );
}
