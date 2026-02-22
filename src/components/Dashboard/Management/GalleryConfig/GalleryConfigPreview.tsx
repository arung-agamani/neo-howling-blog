"use client";

import Typography from "@mui/material/Typography";
import { buildBackgroundStyle } from "@/utils/galleryBackground";
import type { GalleryBackground } from "@/types/GalleryConfig";

interface GalleryConfigPreviewProps {
    background: GalleryBackground;
}

export default function GalleryConfigPreview({
    background,
}: GalleryConfigPreviewProps) {
    const bgStyle = buildBackgroundStyle(background);
    const hasOverlay =
        background.type === "image" && background.overlay?.enabled;

    return (
        <div className="flex flex-col gap-1">
            <Typography variant="caption" color="text.secondary">
                Live Preview
            </Typography>
            <div
                className="relative w-full h-20 rounded overflow-hidden border border-gray-300"
                style={bgStyle}
            >
                {hasOverlay && background.type === "image" && (
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundColor: background.overlay!.color,
                        }}
                    />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/70 text-xs font-medium drop-shadow">
                        Gallery background preview
                    </span>
                </div>
            </div>
        </div>
    );
}
