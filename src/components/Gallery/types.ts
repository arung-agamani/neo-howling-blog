/** Serialised asset data passed from the server component to the gallery client. */
export interface GalleryImage {
    id: string;
    url: string;
    bannerUrl: string | null;
    title: string | null;
    altText: string | null;
    caption: string | null;
    description: string | null;
    tags: string[];
    width: number | null;
    height: number | null;
    uploadedAt: string;
    slug: string;
}
