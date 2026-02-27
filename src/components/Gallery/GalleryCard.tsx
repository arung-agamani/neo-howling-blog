"use client";

import * as React from "react";
import { Image as ImageIcon, ZoomIn } from "lucide-react";
import { cn } from "@/utils/index";
import { rewriteUrlToCDN } from "@/components/Dashboard/MediaLibrary/cdn-config";
import type { GalleryImage } from "./types";
import { useImageLoader } from "./useImageLoader";

interface GalleryCardProps {
    image: GalleryImage;
    index: number;
    onClick: () => void;
}

export default function GalleryCard({ image, index, onClick }: GalleryCardProps) {
    const cardSrc = rewriteUrlToCDN(image.bannerUrl ?? image.url);
    const { loaded, imgRef, onLoad, onError } = useImageLoader(cardSrc);
    const [hovered, setHovered] = React.useState(false);

    return (
        <button
            className="group relative w-full overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cf6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090f] cursor-pointer"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label={`View ${image.title || image.altText || "image"}`}
        >
            {/* 16:9 aspect ratio container */}
            <div className="aspect-video relative bg-[#1a1a28] overflow-hidden">
                {/* Skeleton shimmer while loading */}
                {!loaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a28] via-[#25253a] to-[#1a1a28] animate-pulse" />
                        <ImageIcon className="relative z-10 w-8 h-8 text-white/10" />
                    </div>
                )}

                {/* Image */}
                <img
                    ref={imgRef}
                    src={cardSrc}
                    alt={image.altText || image.title || `Gallery image ${index + 1}`}
                    className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out",
                        "group-hover:scale-105",
                        loaded ? "opacity-100" : "opacity-0",
                    )}
                    loading="lazy"
                    onLoad={onLoad}
                    onError={onError}
                />

                {/* Hover overlay */}
                <div
                    className={cn(
                        "absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent",
                        "transition-opacity duration-300",
                        hovered ? "opacity-100" : "opacity-0",
                    )}
                />

                {/* Bottom info panel */}
                <div
                    className={cn(
                        "absolute bottom-0 left-0 right-0 p-3 transition-all duration-300",
                        hovered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
                    )}
                >
                    {image.title && (
                        <p className="text-white text-sm font-semibold leading-tight truncate drop-shadow-md">
                            {image.title}
                        </p>
                    )}
                    {image.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {image.tags.slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#8b7cf6]/30 text-[#c4bcff] backdrop-blur-sm border border-[#8b7cf6]/30"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Zoom icon */}
                <div
                    className={cn(
                        "absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center",
                        "transition-all duration-300",
                        hovered ? "opacity-100 scale-100" : "opacity-0 scale-75",
                    )}
                >
                    <ZoomIn className="w-3.5 h-3.5 text-white" />
                </div>

                {/* Border glow on hover */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-lg ring-1 transition-all duration-300 pointer-events-none",
                        hovered
                            ? "ring-[#8b7cf6]/60 shadow-[inset_0_0_0_1px_rgba(139,124,246,0.6)]"
                            : "ring-white/5",
                    )}
                />
            </div>
        </button>
    );
}
