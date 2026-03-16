"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
    ChevronLeft,
    ChevronRight,
    X,
    Tag,
    Calendar,
    Download,
} from "lucide-react";
import { cn } from "@/utils/index";
import { rewriteUrlToCDN } from "@/components/Dashboard/MediaLibrary/cdn-config";
import type { GalleryImage } from "./types";
import { PLATFORM_MAP, detectPlatform, pickSourceUrl } from "./platforms";
import { extractUrls, renderDescriptionText } from "./utils";
import SourceLink from "./SourceLink";

interface LightboxProps {
    images: GalleryImage[];
    current: number;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    onJumpTo: (index: number) => void;
}

function BannerDownloadButton({
    url,
    onDownload,
}: {
    url: string;
    onDownload: (url: string, variant: "original" | "banner") => void;
}) {
    const [dims, setDims] = React.useState<{ w: number; h: number } | null>(null);

    React.useEffect(() => {
        setDims(null);
        const img = new Image();
        img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = url;
    }, [url]);

    return (
        <button
            onClick={() => onDownload(url, "banner")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 hover:border-white/25 transition-all"
        >
            <Download className="w-3 h-3" />
            <span>
                Banner
                {dims && (
                    <span className="ml-1 opacity-60">{dims.w}×{dims.h}</span>
                )}
            </span>
        </button>
    );
}

export default function Lightbox({
    images,
    current,
    onClose,
    onPrev,
    onNext,
    onJumpTo,
}: LightboxProps) {
    const image = images[current];
    const hasPrev = current > 0;
    const hasNext = current < images.length - 1;
    const [imgLoaded, setImgLoaded] = React.useState(false);

    // Reset load state when navigating
    React.useEffect(() => {
        setImgLoaded(false);
    }, [current]);

    // Keyboard navigation
    React.useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") onPrev();
            if (e.key === "ArrowRight") onNext();
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onPrev, onNext, onClose]);

    // Lock body scroll while lightbox is open
    React.useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    const formattedDate = React.useMemo(() => {
        try {
            return new Date(image.uploadedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return null;
        }
    }, [image.uploadedAt]);

    const handleDownload = React.useCallback(
        async (url: string, variant: "original" | "banner") => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                const ext = url.split("?")[0].split(".").pop() ?? "jpg";
                const baseName = image.slug || image.id;
                const filename = variant === "banner"
                    ? `${baseName}-banner.${ext}`
                    : `${baseName}.${ext}`;
                const a = document.createElement("a");
                a.href = objectUrl;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(objectUrl);
            } catch {
                window.open(url, "_blank");
            }
        },
        [image.slug, image.id],
    );

    const descUrls = React.useMemo(
        () => (image.description ? extractUrls(image.description) : []),
        [image.description],
    );
    const platform = React.useMemo(
        () => detectPlatform(image.tags, descUrls),
        [image.tags, descUrls],
    );
    const sourceUrl = React.useMemo(
        () => pickSourceUrl(platform, descUrls),
        [platform, descUrls],
    );

    return (
        <DialogPrimitive.Portal>
            {/* Backdrop */}
            <DialogPrimitive.Overlay
                className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                onClick={onClose}
            />

            {/* Content */}
            <DialogPrimitive.Content
                className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 md:p-8 focus:outline-none"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onClick={onClose}
            >
                <DialogPrimitive.Title className="sr-only">
                    {image.title ?? "Image lightbox"}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                    Viewing image {current + 1} of {images.length}
                </DialogPrimitive.Description>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors border border-white/10"
                    aria-label="Close lightbox"
                >
                    <X className="w-4 h-4 text-white" />
                </button>

                {/* Counter */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 text-xs font-medium">
                    {current + 1} / {images.length}
                </div>

                {/* Main image area */}
                <div
                    className="lightbox-content flex flex-col items-center w-full max-w-6xl gap-4"
                    key={current}
                >
                    <div className="relative w-full flex items-center justify-center">
                        {/* Prev button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onPrev(); }}
                            disabled={!hasPrev}
                            className={cn(
                                "absolute left-0 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center",
                                "bg-black/60 backdrop-blur-sm border border-white/10 transition-all",
                                hasPrev
                                    ? "hover:bg-white/20 hover:border-[#8b7cf6]/50 text-white cursor-pointer"
                                    : "opacity-20 cursor-not-allowed text-white/30",
                                "-translate-x-0 md:-translate-x-6",
                            )}
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </button>

                        {/* Image */}
                        <div className="relative max-h-[65vh] w-full flex items-center justify-center mx-12 md:mx-16" onClick={(e) => e.stopPropagation()}>
                            {!imgLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full border-2 border-[#8b7cf6]/30 border-t-[#8b7cf6] animate-spin" />
                                </div>
                            )}
                            <img
                                src={rewriteUrlToCDN(image.url)}
                                alt={
                                    image.altText ||
                                    image.title ||
                                    "Gallery image"
                                }
                                className={cn(
                                    "max-h-[65vh] max-w-full object-contain rounded-lg shadow-2xl",
                                    "transition-opacity duration-300",
                                    imgLoaded ? "opacity-100" : "opacity-0",
                                )}
                                onLoad={() => setImgLoaded(true)}
                                draggable={false}
                            />
                        </div>

                        {/* Next button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onNext(); }}
                            disabled={!hasNext}
                            className={cn(
                                "absolute right-0 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center",
                                "bg-black/60 backdrop-blur-sm border border-white/10 transition-all",
                                hasNext
                                    ? "hover:bg-white/20 hover:border-[#8b7cf6]/50 text-white cursor-pointer"
                                    : "opacity-20 cursor-not-allowed text-white/30",
                                "translate-x-0 md:translate-x-6",
                            )}
                            aria-label="Next image"
                        >
                            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </div>

                    {/* Info panel */}
                    <div className="w-full max-w-2xl flex flex-col items-center gap-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {image.title && (
                            <h2 className="text-white text-lg md:text-xl font-semibold leading-tight">
                                {image.title}
                            </h2>
                        )}

                        {image.caption && (
                            <p className="text-white/55 text-sm leading-relaxed">
                                {image.caption}
                            </p>
                        )}

                        {image.description && (
                            <p className="text-white/40 text-xs leading-relaxed max-w-xl whitespace-pre-line">
                                {renderDescriptionText(image.description)}
                            </p>
                        )}

                        {/* Source link */}
                        {sourceUrl && (
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-white/25 text-xs">
                                    Source
                                </span>
                                <SourceLink
                                    platform={platform}
                                    url={sourceUrl}
                                />
                            </div>
                        )}

                        {/* Download buttons */}
                        <div className="flex items-center justify-center gap-2 mt-0.5">
                            <button
                                onClick={() => handleDownload(rewriteUrlToCDN(image.url), "original")}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 hover:border-white/25 transition-all"
                            >
                                <Download className="w-3 h-3" />
                                <span>
                                    Original
                                    {image.width && image.height && (
                                        <span className="ml-1 opacity-60">{image.width}×{image.height}</span>
                                    )}
                                </span>
                            </button>
                            {image.bannerUrl && (
                                <BannerDownloadButton
                                    url={rewriteUrlToCDN(image.bannerUrl)}
                                    onDownload={handleDownload}
                                />
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-0.5">
                            {image.tags.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                    <Tag className="w-3 h-3 text-white/30 shrink-0" />
                                    {image.tags.map((tag) => {
                                        const ps =
                                            PLATFORM_MAP[tag.toLowerCase()];
                                        return ps ? (
                                            <span
                                                key={tag}
                                                className={cn(
                                                    "px-2 py-0.5 rounded-full text-xs font-medium border",
                                                    ps.bg,
                                                    ps.text,
                                                    ps.border,
                                                )}
                                            >
                                                {tag}
                                            </span>
                                        ) : (
                                            <span
                                                key={tag}
                                                className="px-2 py-0.5 rounded-full text-xs bg-[#8b7cf6]/20 text-[#c4bcff] border border-[#8b7cf6]/25"
                                            >
                                                {tag}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                            {formattedDate && (
                                <div className="flex items-center gap-1.5 text-white/35 text-xs">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formattedDate}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thumbnail filmstrip */}
                    <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 px-2" onClick={(e) => e.stopPropagation()}>
                        {images.map((img, i) => (
                            <button
                                key={img.id}
                                onClick={() => onJumpTo(i)}
                                className={cn(
                                    "shrink-0 w-16 h-9 rounded overflow-hidden ring-1 transition-all duration-200",
                                    i === current
                                        ? "ring-[#8b7cf6] opacity-100 scale-105"
                                        : "ring-white/10 opacity-50 hover:opacity-80 hover:ring-white/30",
                                )}
                                aria-label={`Jump to ${img.title || `image ${i + 1}`}`}
                            >
                                <img
                                    src={rewriteUrlToCDN(img.bannerUrl ?? img.url)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
    );
}
