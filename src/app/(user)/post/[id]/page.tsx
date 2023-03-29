/* eslint-disable @next/next/no-img-element */
// "use client";
// import { useEffect, useState } from "react";
import type { Metadata } from "next";
import Link from "next/link";
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
    const data = await fetch(`${baseUrl}/api/post?id=${params.id}&h=1`).then(
        (res) => {
            return res.json();
        }
    );
    console.log(data);

    const metadata: Metadata = {
        title: data.title,
        description: data.description,
        openGraph: {
            title: data.title,
            description: data.description,
            url: `https://blog.howlingmoon.dev/${params.id}`,
            siteName: "Howling Blog",
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

export default async function Page({ params }: { params: Params }) {
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
            <img
                src={
                    data.bannerUrl ||
                    "https://files.howlingmoon.dev/blog/7-5/1596671970721-no-banner-card-compressed.jpg"
                }
                alt="This post's banner image"
            />
            <hr className="my-4" />
            <div
                dangerouslySetInnerHTML={{ __html: data.blogContent }}
                className="mx-2 lg:mx-10 mt-10 font-sans font-normal"
            />
            <Link href="/">
                <div className="home-button">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="white"
                            d="M21 13v10h-6v-6h-6v6h-6v-10h-3l12-12 12 12h-3zm-1-5.907v-5.093h-3v2.093l3 3z"
                        />
                    </svg>
                </div>
            </Link>
        </div>
    );
}
