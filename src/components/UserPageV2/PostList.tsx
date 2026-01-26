import { Post } from "@/app/(userv2)/v2/APIContract";
import startCase from "lodash.startcase";
import Link from "@/components/UserPageV2/LoaderLink";
import React from "react";
import { Heading, Lead, Small, Badge } from "../Typography";

interface Props {
    posts: Post[];
}

const PostList: React.FC<Props> = ({ posts }) => {
    return (
        <>
            {posts.map((post) => (
                <div
                    className="post-container relative flex flex-col py-4 max-w-sm xs:max-w-5xl lg:max-w-none dark:bg-slate-800/30 dark:contrast:bg-slate-800 bg-white/70 contrast:bg-white px-4 overflow-hidden"
                    key={post.id}
                >
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
                                        "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                                    WebkitMaskImage:
                                        "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                                }}
                            />
                        </>
                    )}

                    {/* Content */}
                    <div className="relative z-10">
                        <Heading level={4}>
                            <Link
                                href={`/v2/post/${post.link}`}
                                className="hover:underline"
                            >
                                {post.title}
                            </Link>
                        </Heading>
                        <Lead className="text-wrap break-all ">
                            {post.description}
                        </Lead>
                        <Small>
                            Date Posted:{" "}
                            {new Date(post.datePosted).toLocaleString("en")}
                        </Small>
                        <div className="tags gap-x-4 flex my-4 flex-wrap gap-y-2">
                            {Array.from(new Set(post.tags)).map((tag) => (
                                <Badge key={tag}>{startCase(tag)}</Badge>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

export default PostList;
