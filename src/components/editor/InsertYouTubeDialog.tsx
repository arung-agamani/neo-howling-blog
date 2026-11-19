"use client";

import { useEffect, useState } from "react";
import { Youtube } from "lucide-react";
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
import {
    parseYouTubeUrl,
    youtubeThumbnailUrl,
} from "./youtube/parseYouTubeUrl";
import type { YouTubeVideo } from "./youtube/parseYouTubeUrl";

export default function InsertYouTubeDialog({
    open,
    onOpenChange,
    onInsert,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInsert: (video: YouTubeVideo) => void;
}) {
    const [input, setInput] = useState("");
    const [touched, setTouched] = useState(false);
    const [thumbnailFailed, setThumbnailFailed] = useState(false);

    useEffect(() => {
        if (!open) return;
        setInput("");
        setTouched(false);
        setThumbnailFailed(false);
    }, [open]);

    const video = parseYouTubeUrl(input);
    const error = !input.trim()
        ? "Paste a YouTube URL."
        : video
          ? undefined
          : "That is not a YouTube watch, share, embed, or shorts URL.";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Embed YouTube video</DialogTitle>
                    <DialogDescription>
                        Paste a YouTube URL. Only the video ID is stored, so the
                        embed always points at YouTube.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    <Label htmlFor="youtube-url">YouTube URL</Label>
                    <Input
                        id="youtube-url"
                        value={input}
                        onChange={(event) => {
                            setInput(event.target.value);
                            setThumbnailFailed(false);
                        }}
                        onBlur={() => setTouched(true)}
                        placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        autoFocus
                        aria-invalid={
                            touched && error ? true : undefined
                        }
                    />
                    {touched && error ? (
                        <p className="text-xs text-destructive">{error}</p>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Works with watch, youtu.be, shorts, live, and embed
                            links.
                        </p>
                    )}
                </div>

                {video && (
                    <div className="space-y-1 rounded-md border bg-muted/40 p-3">
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Youtube className="h-3.5 w-3.5" />
                            Preview · {video.videoId}
                        </p>
                        {thumbnailFailed ? (
                            <p className="text-xs text-muted-foreground">
                                Thumbnail unavailable. The embed can still be
                                inserted.
                            </p>
                        ) : (
                            <img
                                key={video.videoId}
                                src={youtubeThumbnailUrl(video.videoId)}
                                alt=""
                                onError={() => setThumbnailFailed(true)}
                                className="aspect-video w-full rounded object-cover"
                            />
                        )}
                    </div>
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
                        disabled={!video}
                        onClick={() => {
                            if (video) onInsert(video);
                        }}
                    >
                        Embed video
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
