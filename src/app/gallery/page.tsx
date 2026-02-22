import prisma from "@/utils/prisma";
import { GalleryClient, type GalleryImage } from "@/components/Gallery";
import { NOT_DELETED_DATE } from "@/services/AssetService";
import { LayoutGrid } from "lucide-react";
import {
    GalleryConfigSchema,
    DEFAULT_GALLERY_CONFIG,
    GALLERY_CONFIG_KEY,
    type GalleryConfig,
} from "@/types/GalleryConfig";
import { buildBackgroundStyle } from "@/utils/galleryBackground";

const GALLERY_TAG = "banner";

async function getGalleryImages(): Promise<GalleryImage[]> {
    const assets = await prisma.assets.findMany({
        where: {
            tags: { hasSome: [GALLERY_TAG] },
            type: "Image",
            deletedAt: NOT_DELETED_DATE,
            uploadStatus: "Completed",
        },
        select: {
            id: true,
            url: true,
            title: true,
            altText: true,
            caption: true,
            description: true,
            tags: true,
            width: true,
            height: true,
            uploadedAt: true,
            slug: true,
            variants: {
                select: { name: true, url: true },
            },
        },
        orderBy: { uploadedAt: "desc" },
    });

    return assets.map(({ variants, ...asset }) => ({
        ...asset,
        uploadedAt: asset.uploadedAt.toISOString(),
        bannerUrl: variants.find((v) => v.name === "banner")?.url ?? null,
    }));
}

async function getGalleryConfig(): Promise<GalleryConfig> {
    const row = await prisma.config.findUnique({
        where: { key: GALLERY_CONFIG_KEY },
    });
    if (!row) return DEFAULT_GALLERY_CONFIG;
    try {
        const parsed = GalleryConfigSchema.safeParse(JSON.parse(row.value));
        return parsed.success ? parsed.data : DEFAULT_GALLERY_CONFIG;
    } catch {
        return DEFAULT_GALLERY_CONFIG;
    }
}

export default async function GalleryPage() {
    const [images, config] = await Promise.all([
        getGalleryImages(),
        getGalleryConfig(),
    ]);

    const bgStyle = buildBackgroundStyle(config.background);
    const hasOverlay =
        config.background.type === "image" &&
        config.background.overlay?.enabled;

    return (
        <main className="relative min-h-screen" style={bgStyle}>
            {/* Overlay for image backgrounds */}
            {hasOverlay && config.background.type === "image" && (
                <div
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        backgroundColor: config.background.overlay!.color,
                    }}
                />
            )}

            {/* Header */}
            <header className="sticky top-0 z-20 bg-black/60 backdrop-blur-md border-b border-white/[0.06]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#8b7cf6]/20 border border-[#8b7cf6]/30 flex items-center justify-center">
                            <LayoutGrid className="w-4 h-4 text-[#8b7cf6]" />
                        </div>
                        <div>
                            <h1 className="text-white text-lg font-bold leading-none tracking-tight">
                                Howling Gallery
                            </h1>
                            <p className="text-[#8888a8] text-xs mt-0.5">
                                Banner collection
                            </p>
                        </div>
                    </div>

                    {images.length > 0 && (
                        <span className="text-[#8888a8] text-sm tabular-nums">
                            {images.length}{" "}
                            {images.length === 1 ? "image" : "images"}
                        </span>
                    )}
                </div>
            </header>

            {/* Gallery grid */}
            <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
                <GalleryClient images={images} />
            </section>

            {/* Footer */}
            <footer className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 mt-4 border-t border-white/[0.06]">
                <p className="text-center text-[#8888a8] text-xs">
                    Showing images tagged{" "}
                    <span className="px-1.5 py-0.5 rounded bg-[#8b7cf6]/15 text-[#c4bcff] border border-[#8b7cf6]/20">
                        {GALLERY_TAG}
                    </span>
                </p>
            </footer>
        </main>
    );
}
