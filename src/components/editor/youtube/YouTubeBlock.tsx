import { createReactBlockSpec } from "@blocknote/react";
import { youtubeEmbedSrc, parseYouTubeUrl } from "./parseYouTubeUrl";

/** 16:9 player frame shared by the editor and the exported HTML. */
const EMBED_ALLOW =
    "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

/**
 * `createReactBlockSpec` returns a spec factory in BlockNote 0.56, so the
 * result is invoked once here.
 */
export const YouTubeBlock = createReactBlockSpec(
    {
        type: "youtube",
        propSchema: {
            url: { default: "" },
            videoId: { default: "" },
        },
        content: "none",
    },
    {
        render: ({ block }) => {
            const { videoId } = block.props;

            if (!videoId) {
                return (
                    <div
                        contentEditable={false}
                        className="my-4 flex aspect-video w-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
                    >
                        No YouTube video selected
                    </div>
                );
            }

            return (
                <div
                    contentEditable={false}
                    draggable={false}
                    className="my-4 aspect-video w-full overflow-hidden rounded-lg border bg-black"
                >
                    <iframe
                        src={youtubeEmbedSrc(videoId)}
                        title="YouTube video"
                        allow={EMBED_ALLOW}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        className="h-full w-full"
                    />
                </div>
            );
        },

        // Recognizes YouTube iframes when importing existing HTML, so the
        // block survives an HTML -> blocks round-trip.
        parse: (element) => {
            if (element.tagName.toLowerCase() !== "iframe") return undefined;
            const video = parseYouTubeUrl(
                element.getAttribute("src") ?? "",
            );
            if (!video) return undefined;
            return { url: video.watchUrl, videoId: video.videoId };
        },

        // Used by blocksToHTMLLossy -> blogContent. Emitted as a bare iframe;
        // the public renderer supplies the responsive wrapper.
        toExternalHTML: ({ block }) => {
            const { videoId } = block.props;
            if (!videoId) return <p>YouTube video unavailable</p>;
            return (
                <iframe
                    src={youtubeEmbedSrc(videoId)}
                    title="YouTube video"
                    allow={EMBED_ALLOW}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    width="560"
                    height="315"
                />
            );
        },
    },
)();
