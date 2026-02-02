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
import Tooltip from "@mui/material/Tooltip";
import { PostMetadata } from "@/types";
import { APP_BAR_HEIGHT } from "@/constants";
import Typography from "@/components/Typography";
import {
    Dialog,
    DialogContent,
    SwipeableDrawer,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { MediaLibrary } from "@/components/Dashboard/MediaLibrary";
import { useAutosave } from "@/hooks/useAutosave";

const Editor = dynamic(() => import("@/components/Dashboard/Editor"), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});

interface PanelContentProps {
    title: string;
    setTitle: (value: string) => void;
    description: string;
    setDescription: (value: string) => void;
    bannerUrl: string;
    setBannerUrl: (value: string) => void;
    tags: string;
    setTags: (value: string) => void;
    bannerPreviewVisible: boolean;
    previewBannerUrl: (url: string) => void;
    imagePrevRef: React.RefObject<HTMLImageElement | null>;
    hasUnsavedChanges: boolean;
    setHasUnsavedChanges: (value: boolean) => void;
    isSaving: boolean;
    saveHandler: () => void;
    setMediaLibOpen: (value: boolean) => void;
    // Autosave props
    lastAutosave: Date | null;
    isAutosaveScheduled: boolean;
    autosaveInterval: number;
}

/**
 * Format the autosave interval for display
 */
function formatInterval(ms: number): string {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
}

/**
 * Format the last autosave time for display
 */
function formatLastAutosave(date: Date | null): string {
    if (!date) return "Never";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.round(diffMs / 1000);

    if (diffSeconds < 5) return "Just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    return date.toLocaleTimeString();
}

const PanelContent = ({
    title,
    setTitle,
    description,
    setDescription,
    bannerUrl,
    setBannerUrl,
    tags,
    setTags,
    bannerPreviewVisible,
    previewBannerUrl,
    imagePrevRef,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isSaving,
    saveHandler,
    setMediaLibOpen,
    lastAutosave,
    isAutosaveScheduled,
    autosaveInterval,
}: PanelContentProps) => (
    <Box
        className="flex flex-col h-full"
        sx={{
            paddingTop: 2,
            paddingBottom: 2,
            backgroundColor: "white",
        }}
    >
        <Box className="mx-2 pb-4 flex-1 overflow-y-auto">
            <TextField
                label="Title"
                name="title"
                value={title}
                multiline
                minRows={2}
                fullWidth
                margin="dense"
                variant="outlined"
                onChange={(e) => {
                    setTitle(e.target.value);
                    setHasUnsavedChanges(true);
                }}
            />
            <TextField
                label="Description"
                name="description"
                value={description}
                multiline
                minRows={2}
                fullWidth
                margin="dense"
                variant="outlined"
                onChange={(e) => {
                    setDescription(e.target.value);
                    setHasUnsavedChanges(true);
                }}
            />
            <TextField
                label="Banner"
                name="bannerUrl"
                value={bannerUrl}
                multiline
                minRows={2}
                fullWidth
                margin="dense"
                variant="outlined"
                onChange={(e) => {
                    const newUrl = e.target.value;
                    setBannerUrl(newUrl);
                    previewBannerUrl(newUrl);
                    setHasUnsavedChanges(true);
                }}
            />
            <TextField
                label="Tags"
                name="tags"
                value={tags}
                multiline
                minRows={2}
                fullWidth
                margin="dense"
                variant="outlined"
                onChange={(e) => {
                    setTags(e.target.value);
                    setHasUnsavedChanges(true);
                }}
            />
            {bannerPreviewVisible && bannerUrl && (
                <img
                    src={bannerUrl}
                    alt=""
                    id="bannerPreview"
                    ref={imagePrevRef}
                    className="w-full h-auto"
                    style={{ marginTop: 8 }}
                />
            )}
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
            {/* Autosave status indicator */}
            <Box className="flex flex-col gap-1 text-center text-xs text-gray-500 mb-1">
                <Tooltip
                    title={`Autosave every ${formatInterval(autosaveInterval)} of inactivity`}
                >
                    <span>
                        {isAutosaveScheduled && hasUnsavedChanges ? (
                            <span className="text-blue-500">
                                ⏱ Autosave pending...
                            </span>
                        ) : lastAutosave ? (
                            <span className="text-green-600">
                                ✓ Last autosave:{" "}
                                {formatLastAutosave(lastAutosave)}
                            </span>
                        ) : (
                            <span>
                                Autosave: {formatInterval(autosaveInterval)}
                            </span>
                        )}
                    </span>
                </Tooltip>
            </Box>
            <Chip
                label={
                    hasUnsavedChanges ? "Unsaved Changes" : "All Changes Saved"
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
    </Box>
);

export default function Page() {
    const [content, setContent] = useState("");
    const [page, setPage] = useState<PostMetadata>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [mediaLibOpen, setMediaLibOpen] = useState(false);

    // Track current post ID (for autosave to update URL after creating draft)
    const [currentPostId, setCurrentPostId] = useState<string | null>(null);

    // Controlled state for form fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [bannerUrl, setBannerUrl] = useState("");
    const [tags, setTags] = useState("");
    const [bannerPreviewVisible, setBannerPreviewVisible] = useState(false);

    const imagePrevRef = useRef<HTMLImageElement>(null);

    const router = useRouter();
    const searchParams = useSearchParams();

    // Responsive detection
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    // Sync currentPostId with URL param
    useEffect(() => {
        const id = searchParams?.get("id");
        setCurrentPostId(id || null);
    }, [searchParams]);

    useEffect(() => {
        (async () => {
            if (!searchParams) return setLoading(false);
            const id = searchParams.get("id");
            if (!id) return setLoading(false);

            try {
                const res = await axios.get("/api/v1/posts/" + id);
                setContent(res.data.blogContent);
                setPage(res.data);
                // Initialize form fields from fetched data
                setTitle(res.data.title || "");
                setDescription(res.data.description || "");
                setBannerUrl(res.data.bannerUrl || "");
                setTags(res.data.tags?.join(", ") || "");
                if (res.data.bannerUrl) {
                    setBannerPreviewVisible(true);
                }
            } catch (error) {
                console.error("Failed to fetch post:", error);
                setContent("<h1>Failed to fetch content</h1>");
            } finally {
                setLoading(false);
            }
        })();
    }, [searchParams]);

    // Initialize form fields when page data changes (for new posts scenario)
    useEffect(() => {
        if (page.title !== undefined && title === "")
            setTitle(page.title || "");
        if (page.description !== undefined && description === "")
            setDescription(page.description || "");
        if (page.bannerUrl !== undefined && bannerUrl === "") {
            setBannerUrl(page.bannerUrl || "");
            if (page.bannerUrl) setBannerPreviewVisible(true);
        }
        if (page.tags !== undefined && tags === "")
            setTags(page.tags?.join(", ") || "");
    }, [page]);

    const previewBannerUrl = useCallback((url: string) => {
        if (!url) {
            setBannerPreviewVisible(false);
            return;
        }

        fetch(url, { method: "HEAD" })
            .then((res) => {
                const contentType = res.headers.get("content-type");
                const isImage = contentType?.startsWith("image");
                setBannerPreviewVisible(!!isImage);
            })
            .catch(() => {
                setBannerPreviewVisible(false);
            });
    }, []);

    /**
     * Core save function that handles both creating new posts and updating existing ones.
     * @param isAutosave - If true, uses silent notifications and updates URL without full redirect
     */
    const saveHandler = useCallback(
        async (isAutosave: boolean = false) => {
            // Use currentPostId which stays in sync, or fall back to URL param
            const id = currentPostId || searchParams?.get("id");
            const isUpdate = !!id;

            setIsSaving(true);

            try {
                if (isUpdate) {
                    await axios.patch("/api/v1/posts/" + id, {
                        id,
                        op: "update",
                        blogContent: content,
                        title: title,
                        description: description,
                        bannerUrl: bannerUrl,
                        tags: tags
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                    });

                    setHasUnsavedChanges(false);
                    if (!isAutosave) {
                        toast.success("Post updated!", {
                            position: "top-center",
                            autoClose: 3000,
                            closeOnClick: true,
                            theme: "light",
                        });
                    }
                } else {
                    // Creating a new post (auto-draft)
                    const res = await axios.post("/api/v1/posts", {
                        author: page.author || "Shirayuki Haruka", // TODO: Get from auth context
                        blogContent: content || "<p></p>",
                        description: description || "Draft",
                        tags: tags
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        title: title || "Untitled Draft",
                        bannerUrl: bannerUrl,
                    });

                    setHasUnsavedChanges(false);
                    const newPostId = res.data.data.id;

                    // Update currentPostId so subsequent autosaves update instead of create
                    setCurrentPostId(newPostId);

                    if (isAutosave) {
                        // For autosave, silently update URL without full navigation
                        window.history.replaceState(
                            null,
                            "",
                            `/dashboard/main/posts/edit?id=${newPostId}`,
                        );
                    } else {
                        toast.success("Post created!", {
                            onClose: () => {
                                router.push(
                                    `/dashboard/main/posts/edit?id=${newPostId}`,
                                );
                            },
                            autoClose: 2000,
                        });
                    }
                }
            } catch (error) {
                console.error("Save failed:", error);
                if (!isAutosave) {
                    toast.error(
                        isUpdate
                            ? "Post updating failed"
                            : "Post creation failed",
                    );
                }
                throw error; // Re-throw for autosave error handling
            } finally {
                setIsSaving(false);
            }
        },
        [
            currentPostId,
            searchParams,
            content,
            title,
            description,
            bannerUrl,
            tags,
            page.author,
            router,
        ],
    );

    /**
     * Autosave handler - wraps saveHandler for autosave-specific behavior
     */
    const autosaveHandler = useCallback(async () => {
        try {
            await saveHandler(true);
        } catch (error) {
            // Autosave errors are logged but not shown to user
            console.error("Autosave failed:", error);
        }
    }, [saveHandler]);

    /**
     * Manual save handler - wraps saveHandler for button clicks
     */
    const manualSaveHandler = useCallback(() => {
        saveHandler(false);
    }, [saveHandler]);

    // Autosave hook integration
    const {
        config: autosaveConfig,
        lastAutosave,
        isScheduled: isAutosaveScheduled,
    } = useAutosave({
        onSave: autosaveHandler,
        hasUnsavedChanges,
        isSaving,
        enabled: true,
        dependencies: [content, title, description, bannerUrl, tags],
    });

    if (loading) return <h1>Loading...</h1>;

    return (
        <div
            className="flex"
            style={{
                height: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
            }}
        >
            <div
                className="flex-grow bg-white"
                style={{ minWidth: 0, overflow: "hidden" }}
            >
                <Editor
                    page={page}
                    setPage={setPage}
                    content={content}
                    setContent={setContent}
                    setHasUnsavedChanges={setHasUnsavedChanges}
                />
            </div>

            {/* Collapse/Expand Button - Desktop only */}
            {!isMobile && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        background: "#fff",
                        borderLeft: "1px solid #eee",
                        minWidth: "24px",
                        flexShrink: 0,
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
            )}

            {/* Right Panel - Desktop: Side panel, always mounted for state preservation */}
            {!isMobile && (
                <div
                    className="sticky h-full top-0 flex flex-col bg-white"
                    id="right-panel"
                    style={{
                        width: rightPanelOpen ? "320px" : "0px",
                        maxWidth: "320px",
                        overflow: "hidden",
                        transition: "width 0.3s ease",
                        color: "inherit",
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            width: "320px",
                            height: "100%",
                        }}
                    >
                        <PanelContent
                            title={title}
                            setTitle={setTitle}
                            description={description}
                            setDescription={setDescription}
                            bannerUrl={bannerUrl}
                            setBannerUrl={setBannerUrl}
                            tags={tags}
                            setTags={setTags}
                            bannerPreviewVisible={bannerPreviewVisible}
                            previewBannerUrl={previewBannerUrl}
                            imagePrevRef={imagePrevRef}
                            hasUnsavedChanges={hasUnsavedChanges}
                            setHasUnsavedChanges={setHasUnsavedChanges}
                            isSaving={isSaving}
                            saveHandler={manualSaveHandler}
                            setMediaLibOpen={setMediaLibOpen}
                            lastAutosave={lastAutosave}
                            isAutosaveScheduled={isAutosaveScheduled}
                            autosaveInterval={autosaveConfig.interval}
                        />
                    </div>
                </div>
            )}

            {/* Mobile: Floating button to open bottom sheet */}
            {isMobile && (
                <Button
                    variant="contained"
                    onClick={() => setRightPanelOpen(true)}
                    sx={{
                        position: "fixed",
                        bottom: 16,
                        right: 16,
                        zIndex: 1000,
                        borderRadius: "50%",
                        minWidth: "56px",
                        width: "56px",
                        height: "56px",
                        boxShadow: 3,
                    }}
                    aria-label="Open settings panel"
                >
                    ⚙️
                </Button>
            )}

            {/* Mobile: Bottom Sheet using SwipeableDrawer */}
            {isMobile && (
                <SwipeableDrawer
                    anchor="bottom"
                    open={rightPanelOpen}
                    onClose={() => setRightPanelOpen(false)}
                    onOpen={() => setRightPanelOpen(true)}
                    disableSwipeToOpen={false}
                    swipeAreaWidth={20}
                    ModalProps={{
                        keepMounted: true, // Better mobile performance and state preservation
                    }}
                    PaperProps={{
                        sx: {
                            height: "85vh",
                            maxHeight: "85vh",
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            overflow: "hidden",
                        },
                    }}
                >
                    {/* Drag handle indicator */}
                    <Box
                        sx={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            py: 1.5,
                            backgroundColor: "white",
                            borderBottom: "1px solid #eee",
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 4,
                                backgroundColor: "#ccc",
                                borderRadius: 2,
                            }}
                        />
                    </Box>
                    {/* Header with close button */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            px: 2,
                            py: 1,
                            backgroundColor: "white",
                            borderBottom: "1px solid #eee",
                        }}
                    >
                        <span
                            style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                        >
                            Post Settings
                        </span>
                        <Button
                            onClick={() => setRightPanelOpen(false)}
                            sx={{ minWidth: "auto", p: 1 }}
                        >
                            ✕
                        </Button>
                    </Box>
                    <Box sx={{ height: "calc(100% - 60px)", overflow: "auto" }}>
                        <PanelContent
                            title={title}
                            setTitle={setTitle}
                            description={description}
                            setDescription={setDescription}
                            bannerUrl={bannerUrl}
                            setBannerUrl={setBannerUrl}
                            tags={tags}
                            setTags={setTags}
                            bannerPreviewVisible={bannerPreviewVisible}
                            previewBannerUrl={previewBannerUrl}
                            imagePrevRef={imagePrevRef}
                            hasUnsavedChanges={hasUnsavedChanges}
                            setHasUnsavedChanges={setHasUnsavedChanges}
                            isSaving={isSaving}
                            saveHandler={manualSaveHandler}
                            setMediaLibOpen={setMediaLibOpen}
                            lastAutosave={lastAutosave}
                            isAutosaveScheduled={isAutosaveScheduled}
                            autosaveInterval={autosaveConfig.interval}
                        />
                    </Box>
                </SwipeableDrawer>
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
