import type { GalleryBackground } from "@/types/GalleryConfig";
import type { CSSProperties } from "react";

/**
 * Converts a GalleryBackground config value into a React inline style object
 * that can be applied to the gallery page's root element.
 */
export function buildBackgroundStyle(bg: GalleryBackground): CSSProperties {
    if (bg.type === "color") {
        return { backgroundColor: bg.color };
    }

    return {
        backgroundImage: `url(${bg.imageUrl})`,
        backgroundSize: bg.size,
        backgroundPosition: bg.position,
        backgroundRepeat: bg.repeat,
        backgroundAttachment: bg.attachment,
    };
}
