import { z } from "zod";

// ─── TypeScript interfaces ───────────────────────────────────────────────────

export type BackgroundType = "color" | "image";

export interface GalleryBackgroundColor {
    type: "color";
    /** Any valid CSS color value, e.g. "#09090f", "hsl(240 10% 4%)" */
    color: string;
}

export interface GalleryBackgroundImage {
    type: "image";
    /** Absolute URL or a path to an asset in the media library */
    imageUrl: string;
    /** CSS background-size: "cover" | "contain" | "auto" | custom e.g. "50%" */
    size: string;
    /** CSS background-position, e.g. "center", "top left", "50% 50%" */
    position: string;
    /** CSS background-repeat */
    repeat: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
    /** CSS background-attachment */
    attachment: "scroll" | "fixed" | "local";
    /** Optional dark overlay rendered on top of the image */
    overlay?: {
        enabled: boolean;
        /** CSS color including alpha, e.g. "rgba(0,0,0,0.6)" */
        color: string;
    };
}

export type GalleryBackground = GalleryBackgroundColor | GalleryBackgroundImage;

export interface GalleryConfig {
    background: GalleryBackground;
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const OverlaySchema = z.object({
    enabled: z.boolean(),
    color: z.string(),
});

const BackgroundColorSchema = z.object({
    type: z.literal("color"),
    color: z.string(),
});

const BackgroundImageSchema = z.object({
    type: z.literal("image"),
    imageUrl: z.string().url(),
    size: z.string().default("cover"),
    position: z.string().default("center"),
    repeat: z
        .enum(["no-repeat", "repeat", "repeat-x", "repeat-y"])
        .default("no-repeat"),
    attachment: z.enum(["scroll", "fixed", "local"]).default("scroll"),
    overlay: OverlaySchema.optional(),
});

export const GalleryBackgroundSchema = z.discriminatedUnion("type", [
    BackgroundColorSchema,
    BackgroundImageSchema,
]);

export const GalleryConfigSchema = z.object({
    background: GalleryBackgroundSchema,
});

// ─── Constant ────────────────────────────────────────────────────────────────

export const GALLERY_CONFIG_KEY = "gallery_config";

export const DEFAULT_GALLERY_CONFIG: GalleryConfig = {
    background: { type: "color", color: "#09090f" },
};
