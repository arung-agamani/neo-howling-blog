"use client";

import { useEffect, useState } from "react";
import { Film, Music, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export type MediaKind = "video" | "audio";

const VIDEO_EXTENSIONS = ["mp4", "webm", "ogv", "mov", "m4v", "mkv"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "oga", "m4a", "aac", "flac", "opus"];

const KIND_LABEL: Record<MediaKind, string> = {
    video: "Video",
    audio: "Audio",
};

/** Extension of the URL path, lowercased, without the dot. */
function extensionOf(url: string): string {
    try {
        const path = new URL(url).pathname;
        const last = path.split("/").pop() ?? "";
        const dot = last.lastIndexOf(".");
        return dot > -1 ? last.slice(dot + 1).toLowerCase() : "";
    } catch {
        return "";
    }
}

function detectKind(url: string): MediaKind | null {
    const extension = extensionOf(url);
    if (VIDEO_EXTENSIONS.includes(extension)) return "video";
    if (AUDIO_EXTENSIONS.includes(extension)) return "audio";
    return null;
}

function nameFromUrl(url: string): string {
    try {
        const path = new URL(url).pathname;
        const file = decodeURIComponent(path.split("/").pop() ?? "");
        return file || url;
    } catch {
        return url;
    }
}

function validateUrl(url: string): string | undefined {
    if (!url.trim()) return "Paste the media URL.";
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return "Only http(s) URLs are supported.";
        }
        return undefined;
    } catch {
        return "Enter a full URL, including https://.";
    }
}

export default function InsertMediaDialog({
    kind,
    onOpenChange,
    onInsert,
}: {
    /** Preselected kind; null closes the dialog. */
    kind: MediaKind | null;
    onOpenChange: (open: boolean) => void;
    onInsert: (kind: MediaKind, url: string) => void;
}) {
    const [url, setUrl] = useState("");
    const [selectedKind, setSelectedKind] = useState<MediaKind>("video");
    const [touched, setTouched] = useState(false);
    const [previewFailed, setPreviewFailed] = useState(false);

    useEffect(() => {
        if (!kind) return;
        setSelectedKind(kind);
        setUrl("");
        setTouched(false);
        setPreviewFailed(false);
    }, [kind]);

    const urlError = validateUrl(url);
    const detectedKind = detectKind(url);
    const mismatch =
        !urlError && detectedKind !== null && detectedKind !== selectedKind;
    const canInsert = !urlError;

    return (
        <Dialog open={kind !== null} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Insert {KIND_LABEL[selectedKind]}</DialogTitle>
                    <DialogDescription>
                        Upload the file in the Media Library first, then paste
                        its public URL here.
                    </DialogDescription>
                </DialogHeader>

                <div
                    role="radiogroup"
                    aria-label="Media type"
                    className="grid grid-cols-2 gap-2"
                >
                    {(["video", "audio"] as MediaKind[]).map((option) => {
                        const active = option === selectedKind;
                        const Icon = option === "video" ? Film : Music;
                        return (
                            <button
                                key={option}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => {
                                    setSelectedKind(option);
                                    setPreviewFailed(false);
                                }}
                                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                                    active
                                        ? "border-primary bg-accent"
                                        : "hover:bg-accent/60"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {KIND_LABEL[option]}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="media-url">Media URL</Label>
                    <Input
                        id="media-url"
                        value={url}
                        onChange={(event) => {
                            setUrl(event.target.value);
                            setPreviewFailed(false);
                        }}
                        onBlur={() => setTouched(true)}
                        placeholder="https://cdn.howlingmoon.dev/akasha/2026/01/clip.mp4"
                        autoFocus
                        aria-invalid={touched && urlError ? true : undefined}
                    />
                    {touched && urlError ? (
                        <p className="text-xs text-destructive">{urlError}</p>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Paste the direct file URL from the Media Library,
                            not a page that contains it.
                        </p>
                    )}
                    {mismatch && (
                        <p className="text-xs text-amber-600">
                            This looks like {detectedKind === "video" ? "a video" : "an audio"}{" "}
                            file. Insert it as {KIND_LABEL[detectedKind]} instead?
                            <button
                                type="button"
                                className="ml-1 underline"
                                onClick={() => {
                                    if (detectedKind) setSelectedKind(detectedKind);
                                    setPreviewFailed(false);
                                }}
                            >
                                Switch
                            </button>
                        </p>
                    )}
                </div>

                {!urlError && !previewFailed && (
                    <div className="space-y-1 rounded-md border bg-muted/40 p-3">
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <PlayCircle className="h-3.5 w-3.5" />
                            Preview
                        </p>
                        {selectedKind === "video" ? (
                            <video
                                key={url}
                                src={url}
                                controls
                                preload="metadata"
                                onError={() => setPreviewFailed(true)}
                                className="max-h-48 w-full rounded bg-black"
                            />
                        ) : (
                            <audio
                                key={url}
                                src={url}
                                controls
                                preload="metadata"
                                onError={() => setPreviewFailed(true)}
                                className="w-full"
                            />
                        )}
                    </div>
                )}

                {previewFailed && (
                    <p className="text-xs text-amber-600">
                        The browser could not load this URL. It can still be
                        inserted, but check that the file is public and
                        reachable.
                    </p>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!canInsert}
                        onClick={() => onInsert(selectedKind, url.trim())}
                    >
                        Insert {KIND_LABEL[selectedKind]}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export { nameFromUrl, detectKind };
