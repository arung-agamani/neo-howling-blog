/* eslint-disable @next/next/no-img-element */
// "use client";
// import { useEffect, useState } from "react";
import FloatingContainer from "@/components/FloatingContainer";
import HomeButton from "@/components/HomeButton";
import PostContainer from "@/components/PostContainer";
import ScrollTop from "@/components/ScrollTop";
// import "highlight.js/styles/monokai-sublime.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import "quill/dist/quill.snow.css";
import "./code-block.css";
import "./github-markdown.css";
// import "quilljs-markdown/dist/quilljs-markdown-common-style.css";
// import "./post.css";

interface Params {
    id: string;
}

interface PostResult {
    datePosted: string;
    tags: string[];
    _id: string;
    title: string;
    author: string;
    description: string;
    bannerUrl: string;
    isBannerDark: boolean;
    blogContent: string;
}

const baseUrl =
    process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://blog.howlingmoon.dev";

// const baseUrl = "http://localhost:3001";

export async function generateMetadata({ params }: { params: Params }) {
    const data = await fetch(`${baseUrl}/api/post?id=${params.id}&h=1`, {
        // next: { revalidate: 10 },
        cache: "no-cache",
    }).then((res) => {
        return res.json();
    });

    const metadata: Metadata = {
        title: data.title,
        description: data.description,
        metadataBase: new URL("https://blog.howlingmoon.dev"),
        openGraph: {
            title: data.title,
            description: data.description,
            url: `https://blog.howlingmoon.dev/post/${params.id}`,
            images: [
                {
                    url: data.bannerUrl,
                },
            ],
            type: "website",
        },
    };

    return metadata;
}

export const dynamic = "force-dynamic";
export const revalidate = 2;
export default async function Page({ params }: { params: Params }) {
    const headerLists = headers();
    headerLists.get("a");
    const data = await fetch(`${baseUrl}/api/post?id=${params.id}`).then(
        (res) => res.json(),
    );
    // console.log(data.blogContent);

    return (
        <div className="container mx-auto max-lg bg-white dark:bg-slate-900 px-4 pt-4 overflow-hidden rounded-b-2xl transition-colors duration-200">
            <h1 className="text-3xl mx-8 pt-4 text-center">{data.title}</h1>
            <p className="mx-8 my-4 text-center">{data.description}</p>
            {/* <hr className="mx-4" /> */}
            {data.bannerUrl && (
                <img
                    src={data.bannerUrl}
                    className="mx-auto"
                    alt="This post's banner image"
                />
            )}

            {/* <hr className="my-4" /> */}
            <PostContainer content={data.blogContent} />
            {/* <div
                dangerouslySetInnerHTML={{ __html: data.blogContent }}
                className={`mx-2 p-4 lg:mx-10 mt-10 font-sans font-normal markdown-body bg-white dark:bg-slate-900`}
            /> */}
            <FloatingContainer>
                <HomeButton />
                <ScrollTop />
            </FloatingContainer>
        </div>
    );
}
