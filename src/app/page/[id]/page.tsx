/* eslint-disable @next/next/no-sync-scripts */
import Image from "next/image";
import Script from "next/script";
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

async function getPost(id: string) {
    const res = await fetch(`https://blog.howlingmoon.dev/api/post/${id}`);
    if (!res.ok) return null;
    return res.json() as Promise<PostResult>;
}

export default async function Page({ params }: { params: Params }) {
    const data = await getPost(params.id);
    if (!data)
        return (
            <>
                <h1>No data returned</h1>
                <p>Error might be happened</p>
            </>
        );
    return (
        <div className="post container mx-auto max-lg bg-white px-4 pt-4 overflow-hidden">
            <h1 className=" text-3xl">{data.title}</h1>
            <p>{data.description}</p>
            <hr />
            <img src={data.bannerUrl} alt="This post's banner image" />
            <hr className=" my-4" />
            <div dangerouslySetInnerHTML={{ __html: data.blogContent }} />
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
