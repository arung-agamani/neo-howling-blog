/* eslint-disable @next/next/no-img-element */
// "use client";
// import { useEffect, useState } from "react";
import HomeButton from "@/components/HomeButton";
import ScrollTop from "@/components/ScrollTop";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import "quilljs-markdown/dist/quilljs-markdown-common-style.css";
import "./post.css";

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
        (res) => res.json()
    );
    // console.log(data.blogContent);

    if (!data)
        return (
            <>
                <p className="text-4xl text-white font-bold">
                    Loading awesome content
                </p>
            </>
        );
    return (
        <div className="post container mx-auto max-lg bg-white px-4 pt-4 overflow-hidden">
            <h1 className=" text-3xl mx-8 pt-4">{data.title}</h1>
            <p className="mx-8 my-4">{data.description}</p>
            <hr />
            {data.bannerUrl && (
                <img src={data.bannerUrl} alt="This post's banner image" />
            )}

            <hr className="my-4" />
            <div
                dangerouslySetInnerHTML={{ __html: data.blogContent }}
                className="mx-2 lg:mx-10 mt-10 font-sans font-normal"
            />
            <div className="floating-container flex gap-3">
                <HomeButton />
                <ScrollTop />
            </div>
        </div>
    );
}
