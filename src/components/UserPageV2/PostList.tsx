import { Post } from "@/app/(userv2)/v2/APIContract";
import startCase from "lodash.startcase";
import Link from "@/components/UserPageV2/LoaderLink";
import React from "react";
import { Heading, Lead, Small, Badge } from "../Typography";

// Configurable aspect ratio for post list items (width:height)
const POST_ITEM_ASPECT_RATIO = { width: 45, height: 9 };
const MOBILE_ASPECT_RATIO = { width: 3, height: 1 };

// Toggle to use aspect ratio constraint on mobile (if false, content will scale naturally)
const USE_MOBILE_ASPECT_RATIO = false;

interface Props {
    posts: Post[];
}

const PostList: React.FC<Props> = ({ posts }) => {
    return (
        <>
            {posts.map((post) => (
                <div
                    className="post-container relative flex flex-col py-4 w-full xs:max-w-5xl lg:max-w-none dark:bg-slate-800/30 dark:contrast:bg-slate-800 bg-white/70 contrast:bg-white px-4 overflow-hidden"
                    key={post.id}
                    style={{
                        aspectRatio: USE_MOBILE_ASPECT_RATIO
                            ? `${MOBILE_ASPECT_RATIO.width} / ${MOBILE_ASPECT_RATIO.height}`
                            : undefined,
                    }}
                >
                    <style jsx>{`
                        @media (min-width: 768px) {
                            .post-container {
                                aspect-ratio: ${POST_ITEM_ASPECT_RATIO.width} /
                                    ${POST_ITEM_ASPECT_RATIO.height};
                            }
                        }
                    `}</style>
                    {/* Banner with gradient overlay */}
                    {post.bannerUrl && (
                        <>
                            {/* Banner image layer */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    backgroundImage: `url(${post.bannerUrl})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    maskImage:
                                        "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                                    WebkitMaskImage:
                                        "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                                }}
                            />
                            {/* Dimming overlay - slate for dark mode, white for light mode */}
                            <div
                                className="absolute inset-0 pointer-events-none dark:bg-slate-800/80 bg-white/80"
                                style={{
                                    maskImage:
                                        "linear-gradient(to left, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)",
                                    WebkitMaskImage:
                                        "linear-gradient(to left, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)",
                                }}
                            />
                        </>
                    )}

                    {/* Content */}
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex-grow flex flex-col justify-center">
                            <Heading level={4} className="md:w-2/3">
                                <Link
                                    href={`/v2/post/${post.link}`}
                                    className="hover:underline"
                                >
                                    {post.title}
                                </Link>
                            </Heading>
                            <Lead className="text-wrap break-words line-clamp-2 md:w-2/3">
                                {post.description}
                            </Lead>
                        </div>
                        <div className="flex-shrink-0">
                            <Small>
                                Date Posted:{" "}
                                {new Date(post.datePosted).toLocaleString("en")}
                            </Small>
                            <div className="tags gap-x-4 flex mt-2 flex-wrap gap-y-2">
                                {Array.from(new Set(post.tags)).map((tag) => (
                                    <Badge key={tag}>{startCase(tag)}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

export default PostList;
