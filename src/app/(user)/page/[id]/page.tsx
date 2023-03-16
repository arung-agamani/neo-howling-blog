"use client";
import { useEffect, useState } from "react";
import axios from "@/utils/axios";
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

export default function Page({ params }: { params: Params }) {
    const [data, setData] = useState<any>(null);
    useEffect(() => {
        (async () => {
            try {
                const dataRes = await axios.get("/api/dashboard/post", {
                    params: {
                        id: params.id,
                    },
                });
                setData(dataRes.data.data.page);
            } catch (error) {}
        })();
    }, []);
    if (!data)
        return (
            <>
                <h1>No data returned</h1>
                <p>Error might be happened</p>
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
            {/* <link
                href="
https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css
"
                rel="stylesheet"
            ></link>
            <script
                src="
https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js
"
            ></script>
            <script
                id="parse-codeblock"
                dangerouslySetInnerHTML={{
                    __html: `document.querySelectorAll('pre.ql-syntax').forEach((x) => {
                        x.className = 'language-javascript';
                        const block = document.createElement("code");
                        block.innerHTML = x.innerHTML;
                        x.innerHTML = "";
                        x.appendChild(block);
                        block.className="language-javascript";
                    })`,
                }}
            />

            <script
                id="parse-after"
                dangerouslySetInnerHTML={{
                    __html: `
                const timeout = setInterval(() => {
                    if (Prism) {
                        Prism.highlightAll()
                        clearInterval(timeout)
                    }
                }, 2000)
                `,
                }}
            /> */}
        </div>
    );
}
