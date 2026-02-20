"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Image as ImageIcon } from "lucide-react";
import type { GalleryImage } from "./types";
import GalleryCard from "./GalleryCard";
import Lightbox from "./Lightbox";

interface GalleryClientProps {
    images: GalleryImage[];
}

export default function GalleryClient({ images }: GalleryClientProps) {
    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(
        null,
    );
    const isOpen = lightboxIndex !== null;

    const closeLightbox = React.useCallback(
        () => setLightboxIndex(null),
        [],
    );

    const goPrev = React.useCallback(() => {
        setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
    }, []);

    const goNext = React.useCallback(() => {
        setLightboxIndex((i) =>
            i !== null && i < images.length - 1 ? i + 1 : i,
        );
    }, [images.length]);

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-[#8888a8]">
                <ImageIcon className="w-16 h-16 opacity-20" />
                <p className="text-lg">No images found</p>
                <p className="text-sm opacity-60">
                    Images tagged with &quot;banner&quot; will appear here.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                {images.map((image, i) => (
                    <GalleryCard
                        key={image.id}
                        image={image}
                        index={i}
                        onClick={() => setLightboxIndex(i)}
                    />
                ))}
            </div>

            {/* Lightbox dialog */}
            <DialogPrimitive.Root
                open={isOpen}
                onOpenChange={(open) => !open && closeLightbox()}
            >
                {isOpen && lightboxIndex !== null && (
                    <Lightbox
                        images={images}
                        current={lightboxIndex}
                        onClose={closeLightbox}
                        onPrev={goPrev}
                        onNext={goNext}
                        onJumpTo={setLightboxIndex}
                    />
                )}
            </DialogPrimitive.Root>
        </>
    );
}
